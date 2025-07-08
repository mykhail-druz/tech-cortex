import { supabase } from '@/lib/supabaseClient';
import {
  CategorySpecificationTemplate,
  ProductSpecification,
  SpecificationFilter,
} from '@/lib/supabase/types/specifications';
import { Product } from '@/lib/supabase/types/types';

/**
 * Сервис для работы со спецификациями и фильтрацией
 */
export class SpecificationService {
  /**
   * Получение шаблонов спецификаций для категории с настройками фильтрации
   */
  static async getCategorySpecificationTemplates(
    categoryId: string
  ): Promise<CategorySpecificationTemplate[]> {
    const { data, error } = await supabase
      .from('category_specification_templates')
      .select('*')
      .eq('category_id', categoryId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching specification templates:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Получение фильтруемых спецификаций для категории
   */
  static async getFilterableSpecifications(categorySlug: string): Promise<SpecificationFilter[]> {
    try {
      // Сначала получаем категорию
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();

      if (!category) return [];

      // Получаем фильтруемые шаблоны
      const { data: templates } = await supabase
        .from('category_specification_templates')
        .select('*')
        .eq('category_id', category.id)
        .order('display_order', { ascending: true });

      if (!templates) return [];

      // Для каждого шаблона получаем доступные значения
      const filters: SpecificationFilter[] = [];

      for (const template of templates) {
        const filter: SpecificationFilter = {
          templateId: template.id,
          templateName: template.name,
          filterType: template.filter_type || 'checkbox',
        };

        if (template.data_type === 'enum' && template.enum_values) {
          // Для enum'ов используем предопределенные значения
          filter.values = template.enum_values;
        } else if (template.data_type === 'number') {
          // Для числовых значений находим min/max
          const { data: minMax } = await supabase
            .from('product_specifications')
            .select('value_number')
            .eq('template_id', template.id)
            .not('value_number', 'is', null)
            .order('value_number', { ascending: true });

          if (minMax && minMax.length > 0) {
            filter.min = minMax[0].value_number;
            filter.max = minMax[minMax.length - 1].value_number;
          }
        } else {
          // Для остальных типов получаем уникальные значения
          const { data: uniqueValues } = await supabase
            .from('product_specifications')
            .select('value_enum, value_text')
            .eq('template_id', template.id)
            .not('value_enum', 'is', null)
            .not('value_text', 'is', null);

          if (uniqueValues) {
            const values = new Set<string>();
            uniqueValues.forEach(spec => {
              if (spec.value_enum) values.add(spec.value_enum);
              if (spec.value_text) values.add(spec.value_text);
            });
            filter.values = Array.from(values).sort();
          }
        }

        filters.push(filter);
      }

      return filters;
    } catch (error) {
      console.error('Error getting filterable specifications:', error);
      return [];
    }
  }

  /**
   * Построение индексов спецификаций для быстрой фильтрации
   */
  static async buildSpecificationIndexes(categorySlug: string) {
    const cacheKey = `spec_index_${categorySlug}`;

    // Проверяем кэш (в реальном проекте используйте Redis или Memory cache)
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    try {
      // Получаем все продукты категории с их спецификациями одним запросом
      const { data: products } = await supabase
        .from('products')
        .select(
          `
          id, title, price, 
          subcategory:subcategory_id(slug),
          specifications:product_specifications(
            template_id, value_enum, value_number, value_text,
            template:template_id(name, filter_type, data_type)
          )
        `
        )
        .eq('subcategory.slug', categorySlug);

      if (!products) return {};

      // Строим индексы для каждой спецификации
      const indexes: { [key: string]: any } = {};

      products.forEach(product => {
        product.specifications?.forEach((spec: any) => {
          if (spec.template) {
            const key = spec.template.name;
            if (!indexes[key]) {
              indexes[key] = {
                type: spec.template.filter_type,
                dataType: spec.template.data_type,
                values: new Set(),
              };
            }

            // Добавляем значение в индекс
            const value = spec.value_enum || spec.value_number || spec.value_text;
            if (value !== null && value !== undefined) {
              indexes[key].values.add(value);
            }
          }
        });
      });

      // Конвертируем Sets в Arrays для JSON
      Object.keys(indexes).forEach(key => {
        indexes[key].values = Array.from(indexes[key].values).sort((a, b) => {
          // Сортируем числа как числа, строки как строки
          if (typeof a === 'number' && typeof b === 'number') {
            return a - b;
          }
          return String(a).localeCompare(String(b));
        });
      });

      // Кэшируем результат
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(cacheKey, JSON.stringify(indexes));
      }

      return indexes;
    } catch (error) {
      console.error('Error building specification indexes:', error);
      return {};
    }
  }

  /**
   * Валидация спецификации продукта
   */
  static async validateProductSpecs(
    specs: ProductSpecification[],
    categoryId: string
  ): Promise<any[]> {
    // Базовая валидация - можно расширить
    const issues: any[] = [];

    // Получаем обязательные шаблоны
    const templates = await this.getCategorySpecificationTemplates(categoryId);
    const requiredTemplates = templates.filter(t => t.is_required);

    // Проверяем наличие всех обязательных спецификаций
    requiredTemplates.forEach(template => {
      const hasSpec = specs.some(spec => spec.template_id === template.id);
      if (!hasSpec) {
        issues.push({
          type: 'error',
          templateId: template.id,
          message: `Отсутствует обязательная спецификация: ${template.display_name}`,
          severity: 'high',
        });
      }
    });

    return issues;
  }

  /**
   * Очистка кэша спецификаций
   */
  static clearCache(categorySlug?: string) {
    if (typeof window !== 'undefined') {
      if (categorySlug) {
        sessionStorage.removeItem(`spec_index_${categorySlug}`);
      } else {
        // Очищаем все кэши спецификаций
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith('spec_index_')) {
            sessionStorage.removeItem(key);
          }
        }
      }
    }
  }
}
