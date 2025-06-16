// src/lib/supabase/services/categoryTemplateService.ts
import { supabase } from '../../supabaseClient';
import {
  CategorySpecificationTemplate,
  SpecificationDataType,
  SocketType,
  MemoryType,
  ChipsetType,
  FormFactor,
} from '../types/specifications';

/**
 * Система управления шаблонами спецификаций для категорий
 */
export class CategoryTemplateService {
  /**
   * Создание стандартных шаблонов для всех категорий PC
   */
  static async initializeCategoryTemplates() {
    console.log('🔧 Initializing category specification templates...');

    // 1. ПРОЦЕССОРЫ
    await this.createProcessorTemplates();

    // 2. МАТЕРИНСКИЕ ПЛАТЫ
    await this.createMotherboardTemplates();

    // 3. ПАМЯТЬ
    await this.createMemoryTemplates();

    // 4. ВИДЕОКАРТЫ
    await this.createGpuTemplates();

    // 5. БЛОКИ ПИТАНИЯ
    await this.createPsuTemplates();

    // 6. КОРПУСА
    await this.createCaseTemplates();

    // 7. НАКОПИТЕЛИ
    await this.createStorageTemplates();

    // 8. ОХЛАЖДЕНИЕ
    await this.createCoolingTemplates();

    console.log('✅ All category templates initialized!');
  }

  /**
   * Шаблоны для процессоров
   */
  private static async createProcessorTemplates() {
    const { data: cpuCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'processors')
      .single();

    if (!cpuCategory) {
      console.error('❌ CPU category not found');
      return;
    }

    const templates = [
      {
        category_id: cpuCategory.id,
        name: 'socket',
        display_name: 'Сокет',
        description: 'Тип сокета процессора',
        is_required: true,
        data_type: SpecificationDataType.ENUM,
        enum_values: Object.values(SocketType),
        is_compatibility_key: true,
        is_filterable: true,
        filter_type: 'checkbox' as const,
        display_order: 1,
      },
      {
        category_id: cpuCategory.id,
        name: 'cores',
        display_name: 'Количество ядер',
        description: 'Физическое количество ядер',
        is_required: true,
        data_type: SpecificationDataType.NUMBER,
        is_compatibility_key: false,
        is_filterable: true,
        filter_type: 'range' as const,
        display_order: 2,
        min_value: 2,
        max_value: 32,
      },
      {
        category_id: cpuCategory.id,
        name: 'threads',
        display_name: 'Количество потоков',
        description: 'Логическое количество потоков',
        is_required: true,
        data_type: SpecificationDataType.NUMBER,
        is_compatibility_key: false,
        is_filterable: true,
        filter_type: 'range' as const,
        display_order: 3,
        min_value: 2,
        max_value: 64,
      },
      {
        category_id: cpuCategory.id,
        name: 'base_clock',
        display_name: 'Базовая частота',
        description: 'Базовая частота в ГГц',
        is_required: true,
        data_type: SpecificationDataType.NUMBER,
        is_compatibility_key: false,
        is_filterable: true,
        filter_type: 'range' as const,
        display_order: 4,
        units: 'GHz',
        min_value: 1.0,
        max_value: 6.0,
      },
      {
        category_id: cpuCategory.id,
        name: 'boost_clock',
        display_name: 'Турбо частота',
        description: 'Максимальная турбо частота в ГГц',
        is_required: false,
        data_type: SpecificationDataType.NUMBER,
        is_compatibility_key: false,
        is_filterable: true,
        filter_type: 'range' as const,
        display_order: 5,
        units: 'GHz',
        min_value: 1.0,
        max_value: 7.0,
      },
      {
        category_id: cpuCategory.id,
        name: 'tdp',
        display_name: 'TDP',
        description: 'Тепловыделение в ваттах',
        is_required: true,
        data_type: SpecificationDataType.NUMBER,
        is_compatibility_key: true, // Важно для расчета питания
        is_filterable: true,
        filter_type: 'range' as const,
        display_order: 6,
        units: 'W',
        min_value: 35,
        max_value: 400,
      },
      {
        category_id: cpuCategory.id,
        name: 'integrated_graphics',
        display_name: 'Встроенная графика',
        description: 'Наличие встроенного графического ядра',
        is_required: false,
        data_type: SpecificationDataType.BOOLEAN,
        is_compatibility_key: false,
        is_filterable: true,
        filter_type: 'checkbox' as const,
        display_order: 7,
      },
    ];

    await this.insertTemplates(templates);
  }

  /**
   * Шаблоны для материнских плат
   */
  private static async createMotherboardTemplates() {
    const { data: mbCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'motherboards')
      .single();

    if (!mbCategory) return;

    const templates = [
      {
        category_id: mbCategory.id,
        name: 'socket',
        display_name: 'Сокет',
        description: 'Совместимый сокет процессора',
        is_required: true,
        data_type: SpecificationDataType.ENUM,
        enum_values: Object.values(SocketType),
        is_compatibility_key: true,
        is_filterable: true,
        filter_type: 'checkbox' as const,
        display_order: 1,
      },
      {
        category_id: mbCategory.id,
        name: 'chipset',
        display_name: 'Чипсет',
        description: 'Модель чипсета',
        is_required: true,
        data_type: SpecificationDataType.ENUM,
        enum_values: Object.values(ChipsetType),
        is_compatibility_key: true,
        is_filterable: true,
        filter_type: 'checkbox' as const,
        display_order: 2,
      },
      {
        category_id: mbCategory.id,
        name: 'form_factor',
        display_name: 'Форм-фактор',
        description: 'Размер материнской платы',
        is_required: true,
        data_type: SpecificationDataType.ENUM,
        enum_values: Object.values(FormFactor),
        is_compatibility_key: true,
        is_filterable: true,
        filter_type: 'checkbox' as const,
        display_order: 3,
      },
      {
        category_id: mbCategory.id,
        name: 'memory_type',
        display_name: 'Тип памяти',
        description: 'Поддерживаемый тип памяти',
        is_required: true,
        data_type: SpecificationDataType.ENUM,
        enum_values: Object.values(MemoryType),
        is_compatibility_key: true,
        is_filterable: true,
        filter_type: 'checkbox' as const,
        display_order: 4,
      },
      {
        category_id: mbCategory.id,
        name: 'memory_slots',
        display_name: 'Слоты памяти',
        description: 'Количество слотов для оперативной памяти',
        is_required: true,
        data_type: SpecificationDataType.NUMBER,
        is_compatibility_key: true,
        is_filterable: true,
        filter_type: 'checkbox' as const,
        display_order: 5,
        min_value: 2,
        max_value: 8,
      },
      {
        category_id: mbCategory.id,
        name: 'max_memory',
        display_name: 'Максимум памяти',
        description: 'Максимальный объем поддерживаемой памяти в ГБ',
        is_required: true,
        data_type: SpecificationDataType.NUMBER,
        is_compatibility_key: true,
        is_filterable: true,
        filter_type: 'range' as const,
        display_order: 6,
        units: 'GB',
        min_value: 32,
        max_value: 256,
      },
    ];

    await this.insertTemplates(templates);
  }

  /**
   * Вставка шаблонов в базу данных
   */
  private static async insertTemplates(templates: any[]) {
    for (const template of templates) {
      const { error } = await supabase.from('category_specification_templates').upsert(template, {
        onConflict: 'category_id,name',
      });

      if (error) {
        console.error('❌ Error inserting template:', template.name, error);
      } else {
        console.log('✅ Template created:', template.name);
      }
    }
  }

  /**
   * Получение шаблонов для категории
   */
  static async getTemplatesForCategory(categorySlug: string) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (!category) return [];

    const { data: templates } = await supabase
      .from('category_specification_templates')
      .select('*')
      .eq('category_id', category.id)
      .order('display_order');

    return templates || [];
  }

  /**
   * Валидация спецификации продукта по шаблону
   */
  static validateSpecification(
    template: CategorySpecificationTemplate,
    value: any
  ): { isValid: boolean; error?: string } {
    // Проверка обязательности
    if (template.is_required && (value === null || value === undefined || value === '')) {
      return { isValid: false, error: `${template.display_name} является обязательным` };
    }

    // Проверка типа данных
    switch (template.data_type) {
      case SpecificationDataType.NUMBER:
        if (isNaN(Number(value))) {
          return { isValid: false, error: `${template.display_name} должно быть числом` };
        }
        const numValue = Number(value);
        if (template.min_value && numValue < template.min_value) {
          return {
            isValid: false,
            error: `${template.display_name} должно быть >= ${template.min_value}`,
          };
        }
        if (template.max_value && numValue > template.max_value) {
          return {
            isValid: false,
            error: `${template.display_name} должно быть <= ${template.max_value}`,
          };
        }
        break;

      case SpecificationDataType.ENUM:
        if (template.enum_values && !template.enum_values.includes(value)) {
          return {
            isValid: false,
            error: `${template.display_name} должно быть одним из: ${template.enum_values.join(', ')}`,
          };
        }
        break;

      case SpecificationDataType.BOOLEAN:
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          return { isValid: false, error: `${template.display_name} должно быть true/false` };
        }
        break;
    }

    return { isValid: true };
  }
}
