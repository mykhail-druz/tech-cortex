/**
 * Простой сервис для работы со спецификациями
 * Заменяет сложную систему SmartSpecificationSystem
 */

import { supabase } from '@/lib/supabaseClient';
import {
  SpecificationTemplate,
  ProductSpecification,
  CreateSpecificationTemplate,
  CreateProductSpecification,
  UpdateSpecificationTemplate,
  UpdateProductSpecification,
  ServiceResult,
  SpecificationValidationResult,
  GroupedSpecifications,
  SpecificationFilter,
  ProductComparison
} from './types';

export class SimpleSpecificationService {
  
  // =====================================================
  // РАБОТА С ТЕМПЛЕЙТАМИ КАТЕГОРИЙ
  // =====================================================

  /**
   * Получить все темплейты для категории
   */
  static async getTemplatesForCategory(categoryId: string): Promise<ServiceResult<SpecificationTemplate[]>> {
    try {
      const { data, error } = await supabase
        .from('category_spec_templates')
        .select('*')
        .eq('category_id', categoryId)
        .order('display_order');

      if (error) {
        return { success: false, errors: [error.message] };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  /**
   * Создать новый темплейт спецификации
   */
  static async createTemplate(template: CreateSpecificationTemplate): Promise<ServiceResult<SpecificationTemplate>> {
    try {
      const { data, error } = await supabase
        .from('category_spec_templates')
        .insert(template)
        .select()
        .single();

      if (error) {
        return { success: false, errors: [error.message] };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  /**
   * Обновить темплейт спецификации
   */
  static async updateTemplate(
    templateId: string, 
    updates: UpdateSpecificationTemplate
  ): Promise<ServiceResult<SpecificationTemplate>> {
    try {
      const { data, error } = await supabase
        .from('category_spec_templates')
        .update(updates)
        .eq('id', templateId)
        .select()
        .single();

      if (error) {
        return { success: false, errors: [error.message] };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  /**
   * Удалить темплейт спецификации
   */
  static async deleteTemplate(templateId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from('category_spec_templates')
        .delete()
        .eq('id', templateId);

      if (error) {
        return { success: false, errors: [error.message] };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  /**
   * Массовое создание темплейтов для категории
   */
  static async createTemplatesForCategory(
    categoryId: string, 
    templates: Omit<CreateSpecificationTemplate, 'category_id'>[]
  ): Promise<ServiceResult<SpecificationTemplate[]>> {
    try {
      const templatesWithCategory = templates.map(template => ({
        ...template,
        category_id: categoryId
      }));

      const { data, error } = await supabase
        .from('category_spec_templates')
        .insert(templatesWithCategory)
        .select();

      if (error) {
        return { success: false, errors: [error.message] };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  // =====================================================
  // РАБОТА СО СПЕЦИФИКАЦИЯМИ ПРОДУКТОВ
  // =====================================================

  /**
   * Получить все спецификации продукта
   */
  static async getProductSpecifications(productId: string): Promise<ServiceResult<ProductSpecification[]>> {
    try {
      const { data, error } = await supabase
        .from('product_specifications')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      if (error) {
        return { success: false, errors: [error.message] };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  /**
   * Получить группированные спецификации продукта
   */
  static async getGroupedProductSpecifications(productId: string): Promise<ServiceResult<GroupedSpecifications>> {
    try {
      const result = await this.getProductSpecifications(productId);
      if (!result.success || !result.data) {
        return result as ServiceResult<GroupedSpecifications>;
      }

      const specifications = result.data;
      const required = specifications.filter(spec => spec.is_required);
      const optional = specifications.filter(spec => !spec.is_required);

      return {
        success: true,
        data: {
          required,
          optional,
          all: specifications
        }
      };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  /**
   * Сохранить спецификации продукта
   */
  static async saveProductSpecifications(
    productId: string, 
    specifications: CreateProductSpecification[]
  ): Promise<ServiceResult<ProductSpecification[]>> {
    try {
      // Удаляем старые спецификации
      const { error: deleteError } = await supabase
        .from('product_specifications')
        .delete()
        .eq('product_id', productId);

      if (deleteError) {
        return { success: false, errors: [deleteError.message] };
      }

      // Добавляем новые спецификации
      if (specifications.length === 0) {
        return { success: true, data: [] };
      }

      const { data, error } = await supabase
        .from('product_specifications')
        .insert(specifications)
        .select();

      if (error) {
        return { success: false, errors: [error.message] };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  /**
   * Обновить спецификацию продукта
   */
  static async updateProductSpecification(
    specificationId: string, 
    updates: UpdateProductSpecification
  ): Promise<ServiceResult<ProductSpecification>> {
    try {
      const { data, error } = await supabase
        .from('product_specifications')
        .update(updates)
        .eq('id', specificationId)
        .select()
        .single();

      if (error) {
        return { success: false, errors: [error.message] };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  // =====================================================
  // ВАЛИДАЦИЯ СПЕЦИФИКАЦИЙ
  // =====================================================

  /**
   * Валидировать значение спецификации
   */
  static validateSpecificationValue(
    template: SpecificationTemplate, 
    value: string
  ): SpecificationValidationResult {
    const errors: string[] = [];
    let normalizedValue: string | number | boolean = value;

    // Проверка обязательности
    if (template.is_required && (!value || value.trim() === '')) {
      errors.push(`${template.display_name} является обязательным полем`);
    }

    // Валидация по типу данных
    switch (template.data_type) {
      case 'number':
        const numValue = parseFloat(value);
        if (value && isNaN(numValue)) {
          errors.push(`${template.display_name} должно быть числом`);
        } else if (!isNaN(numValue)) {
          normalizedValue = numValue;
        }
        break;

      case 'boolean':
        if (value && !['true', 'false', '1', '0'].includes(value.toLowerCase())) {
          errors.push(`${template.display_name} должно быть true или false`);
        } else {
          normalizedValue = ['true', '1'].includes(value.toLowerCase());
        }
        break;

      case 'enum':
        if (value && template.enum_values && !template.enum_values.includes(value)) {
          errors.push(`${template.display_name} должно быть одним из: ${template.enum_values.join(', ')}`);
        }
        break;

      case 'text':
      default:
        // Текстовые значения не требуют дополнительной валидации
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      normalizedValue: errors.length === 0 ? normalizedValue : undefined
    };
  }

  /**
   * Валидировать все спецификации продукта
   */
  static async validateProductSpecifications(
    categoryId: string, 
    specifications: Record<string, string>
  ): Promise<ServiceResult<Record<string, SpecificationValidationResult>>> {
    try {
      const templatesResult = await this.getTemplatesForCategory(categoryId);
      if (!templatesResult.success || !templatesResult.data) {
        return { success: false, errors: templatesResult.errors };
      }

      const templates = templatesResult.data;
      const validationResults: Record<string, SpecificationValidationResult> = {};

      for (const template of templates) {
        const value = specifications[template.name] || '';
        validationResults[template.name] = this.validateSpecificationValue(template, value);
      }

      return { success: true, data: validationResults };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  // =====================================================
  // ФИЛЬТРАЦИЯ И ПОИСК
  // =====================================================

  /**
   * Получить фильтры для категории
   */
  static async getFiltersForCategory(categoryId: string): Promise<ServiceResult<SpecificationFilter[]>> {
    try {
      const templatesResult = await this.getTemplatesForCategory(categoryId);
      if (!templatesResult.success || !templatesResult.data) {
        return { success: false, errors: templatesResult.errors };
      }

      const filters: SpecificationFilter[] = templatesResult.data
        .filter(template => template.is_filter)
        .map(template => ({
          name: template.name,
          display_name: template.display_name,
          data_type: template.data_type,
          values: template.enum_values,
          unit: template.unit
        }));

      return { success: true, data: filters };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  /**
   * Поиск продуктов по спецификациям
   */
  static async searchProductsBySpecifications(
    categoryId: string,
    filters: Record<string, string | number | boolean>
  ): Promise<ServiceResult<string[]>> {
    try {
      // Получаем все продукты категории со спецификациями
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          product_specifications (
            name,
            value,
            data_type
          )
        `)
        .eq('category_id', categoryId);

      if (error) {
        return { success: false, errors: [error.message] };
      }

      // Фильтруем продукты по спецификациям
      const matchingProductIds: string[] = [];

      for (const product of products || []) {
        let matches = true;

        for (const [filterName, filterValue] of Object.entries(filters)) {
          if (!filterValue) continue;

          const spec = product.product_specifications?.find(s => s.name === filterName);
          if (!spec) {
            matches = false;
            break;
          }

          // Сравниваем значения в зависимости от типа
          let specValue: string | number | boolean = spec.value;
          if (spec.data_type === 'number') {
            specValue = parseFloat(spec.value);
          } else if (spec.data_type === 'boolean') {
            specValue = ['true', '1'].includes(spec.value.toLowerCase());
          }

          if (specValue !== filterValue) {
            matches = false;
            break;
          }
        }

        if (matches) {
          matchingProductIds.push(product.id);
        }
      }

      return { success: true, data: matchingProductIds };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  // =====================================================
  // СРАВНЕНИЕ ТОВАРОВ
  // =====================================================

  /**
   * Сравнить товары по спецификациям
   */
  static async compareProducts(productIds: string[]): Promise<ServiceResult<ProductComparison>> {
    try {
      // Получаем спецификации всех товаров
      const productSpecs: Record<string, ProductSpecification[]> = {};
      
      for (const productId of productIds) {
        const result = await this.getProductSpecifications(productId);
        if (result.success && result.data) {
          productSpecs[productId] = result.data;
        }
      }

      // Собираем все уникальные спецификации
      const allSpecNames = new Set<string>();
      Object.values(productSpecs).forEach(specs => {
        specs.forEach(spec => allSpecNames.add(spec.name));
      });

      // Формируем данные для сравнения
      const specifications: ProductComparison['specifications'] = {};
      const differences: string[] = [];

      for (const specName of allSpecNames) {
        const specData: { [productId: string]: string } = {};
        let displayName = specName;
        let dataType: string = 'text';
        let unit: string | undefined;
        const values = new Set<string>();

        for (const productId of productIds) {
          const spec = productSpecs[productId]?.find(s => s.name === specName);
          if (spec) {
            specData[productId] = spec.value;
            displayName = spec.display_name;
            dataType = spec.data_type;
            unit = spec.unit;
            values.add(spec.value);
          } else {
            specData[productId] = 'Не указано';
            values.add('Не указано');
          }
        }

        specifications[specName] = {
          display_name: displayName,
          values: specData,
          data_type: dataType,
          unit
        };

        // Если значения различаются, добавляем в различия
        if (values.size > 1) {
          differences.push(displayName);
        }
      }

      return {
        success: true,
        data: {
          specifications,
          differences
        }
      };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  // =====================================================
  // УТИЛИТЫ
  // =====================================================

  /**
   * Форматировать значение спецификации для отображения
   */
  static formatSpecificationValue(
    value: string, 
    dataType: string, 
    unit?: string
  ): string {
    if (!value || value === '') return 'Не указано';

    switch (dataType) {
      case 'boolean':
        return ['true', '1'].includes(value.toLowerCase()) ? 'Да' : 'Нет';
      
      case 'number':
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return value;
        return unit ? `${numValue} ${unit}` : numValue.toString();
      
      default:
        return value;
    }
  }

  /**
   * Создать спецификации продукта из темплейтов
   */
  static async createProductSpecificationsFromTemplates(
    productId: string,
    categoryId: string,
    values: Record<string, string>
  ): Promise<ServiceResult<ProductSpecification[]>> {
    try {
      const templatesResult = await this.getTemplatesForCategory(categoryId);
      if (!templatesResult.success || !templatesResult.data) {
        return { success: false, errors: templatesResult.errors };
      }

      const specifications: CreateProductSpecification[] = templatesResult.data.map(template => ({
        product_id: productId,
        name: template.name,
        display_name: template.display_name,
        value: values[template.name] || '',
        data_type: template.data_type,
        is_required: template.is_required,
        is_filter: template.is_filter,
        display_order: template.display_order,
        enum_values: template.enum_values,
        unit: template.unit
      }));

      return await this.saveProductSpecifications(productId, specifications);
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }
}