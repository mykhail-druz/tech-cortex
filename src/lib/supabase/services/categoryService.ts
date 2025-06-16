import { supabase } from '@/lib/supabaseClient';
import { Category } from '@/lib/supabase/types/types';
import {
  CategorySpecificationTemplate,
  SpecificationDataType,
  SPECIFICATION_ENUMS,
  SocketType,
  MemoryType,
  ChipsetType,
  FormFactor,
} from '@/lib/supabase/types/specifications';

/**
 * 🎯 СЕРВИС СТАНДАРТИЗИРОВАННЫХ КАТЕГОРИЙ
 * Создает категории с предопределенными наборами темплейтов
 */
export class CategoryService {
  /**
   * 📝 СТАНДАРТНЫЕ ТЕМПЛЕЙТЫ ДЛЯ PC КОМПОНЕНТОВ
   */
  private static readonly CATEGORY_TEMPLATES: Record<string, CategorySpecificationTemplate[]> = {
    processors: [
      {
        name: 'socket',
        display_name: 'Сокет',
        description: 'Тип сокета процессора',
        data_type: SpecificationDataType.SOCKET,
        enum_values: Object.values(SocketType),
        enum_source: 'SOCKET_TYPE',
        validation_rules: {
          required: true,
          dataType: SpecificationDataType.SOCKET,
          compatibilityKey: true,
        },
        is_required: true,
        is_filterable: true,
        is_compatibility_key: true,
        display_order: 1,
        filter_order: 1,
        filter_type: 'dropdown',
      },
      {
        name: 'base_frequency',
        display_name: 'Базовая частота',
        description: 'Базовая тактовая частота процессора',
        data_type: SpecificationDataType.FREQUENCY,
        enum_values: [],
        validation_rules: {
          required: true,
          dataType: SpecificationDataType.FREQUENCY,
          minValue: 1000, // 1 GHz
          maxValue: 8000, // 8 GHz
          unit: 'MHz',
        },
        is_required: true,
        is_filterable: true,
        is_compatibility_key: false,
        display_order: 2,
        filter_order: 2,
        filter_type: 'range',
      },
      {
        name: 'boost_frequency',
        display_name: 'Частота в режиме буст',
        description: 'Максимальная частота в режиме ускорения',
        data_type: SpecificationDataType.FREQUENCY,
        enum_values: [],
        validation_rules: {
          required: false,
          dataType: SpecificationDataType.FREQUENCY,
          minValue: 1000,
          maxValue: 8000,
          unit: 'MHz',
        },
        is_required: false,
        is_filterable: true,
        is_compatibility_key: false,
        display_order: 3,
        filter_order: 3,
        filter_type: 'range',
      },
      {
        name: 'cores',
        display_name: 'Количество ядер',
        description: 'Количество физических ядер',
        data_type: SpecificationDataType.NUMBER,
        enum_values: [],
        validation_rules: {
          required: true,
          dataType: SpecificationDataType.NUMBER,
          minValue: 1,
          maxValue: 64,
        },
        is_required: true,
        is_filterable: true,
        is_compatibility_key: false,
        display_order: 4,
        filter_order: 4,
        filter_type: 'checkbox',
      },
      {
        name: 'threads',
        display_name: 'Количество потоков',
        description: 'Количество логических потоков',
        data_type: SpecificationDataType.NUMBER,
        enum_values: [],
        validation_rules: {
          required: true,
          dataType: SpecificationDataType.NUMBER,
          minValue: 1,
          maxValue: 128,
        },
        is_required: true,
        is_filterable: true,
        is_compatibility_key: false,
        display_order: 5,
        filter_order: 5,
        filter_type: 'checkbox',
      },
      {
        name: 'tdp',
        display_name: 'TDP',
        description: 'Тепловыделение (Thermal Design Power)',
        data_type: SpecificationDataType.POWER_CONSUMPTION,
        enum_values: [],
        validation_rules: {
          required: true,
          dataType: SpecificationDataType.POWER_CONSUMPTION,
          minValue: 15,
          maxValue: 500,
          unit: 'W',
        },
        is_required: true,
        is_filterable: true,
        is_compatibility_key: true, // Важно для расчета питания
        display_order: 6,
        filter_order: 6,
        filter_type: 'range',
      },
    ],

    motherboards: [
      {
        name: 'socket',
        display_name: 'Сокет',
        description: 'Совместимый сокет процессора',
        data_type: SpecificationDataType.SOCKET,
        enum_values: Object.values(SocketType),
        enum_source: 'SOCKET_TYPE',
        validation_rules: {
          required: true,
          dataType: SpecificationDataType.SOCKET,
          compatibilityKey: true,
        },
        is_required: true,
        is_filterable: true,
        is_compatibility_key: true,
        display_order: 1,
        filter_order: 1,
        filter_type: 'dropdown',
      },
      {
        name: 'chipset',
        display_name: 'Чипсет',
        description: 'Чипсет материнской платы',
        data_type: SpecificationDataType.CHIPSET,
        enum_values: Object.values(ChipsetType),
        enum_source: 'CHIPSET_TYPE',
        validation_rules: {
          required: true,
          dataType: SpecificationDataType.CHIPSET,
          compatibilityKey: true,
        },
        is_required: true,
        is_filterable: true,
        is_compatibility_key: true,
        display_order: 2,
        filter_order: 2,
        filter_type: 'dropdown',
      },
      {
        name: 'memory_type',
        display_name: 'Тип памяти',
        description: 'Поддерживаемый тип оперативной памяти',
        data_type: SpecificationDataType.MEMORY_TYPE,
        enum_values: Object.values(MemoryType),
        enum_source: 'MEMORY_TYPE',
        validation_rules: {
          required: true,
          dataType: SpecificationDataType.MEMORY_TYPE,
          compatibilityKey: true,
        },
        is_required: true,
        is_filterable: true,
        is_compatibility_key: true,
        display_order: 3,
        filter_order: 3,
        filter_type: 'checkbox',
      },
      {
        name: 'memory_slots',
        display_name: 'Слоты памяти',
        description: 'Количество слотов для оперативной памяти',
        data_type: SpecificationDataType.NUMBER,
        enum_values: [],
        validation_rules: {
          required: true,
          dataType: SpecificationDataType.NUMBER,
          minValue: 2,
          maxValue: 8,
        },
        is_required: true,
        is_filterable: true,
        is_compatibility_key: false,
        display_order: 4,
        filter_order: 4,
        filter_type: 'checkbox',
      },
      {
        name: 'max_memory',
        display_name: 'Максимум памяти',
        description: 'Максимальный объем оперативной памяти',
        data_type: SpecificationDataType.MEMORY_SIZE,
        enum_values: [],
        validation_rules: {
          required: true,
          dataType: SpecificationDataType.MEMORY_SIZE,
          minValue: 8,
          maxValue: 1024,
          unit: 'GB',
        },
        is_required: true,
        is_filterable: true,
        is_compatibility_key: true,
        display_order: 5,
        filter_order: 5,
        filter_type: 'range',
      },
      {
        name: 'form_factor',
        display_name: 'Форм-фактор',
        description: 'Размер материнской платы',
        data_type: SpecificationDataType.ENUM,
        enum_values: Object.values(FormFactor),
        enum_source: 'FORM_FACTOR',
        validation_rules: {
          required: true,
          dataType: SpecificationDataType.ENUM,
          enumValues: Object.values(FormFactor),
          compatibilityKey: true,
        },
        is_required: true,
        is_filterable: true,
        is_compatibility_key: true,
        display_order: 6,
        filter_order: 6,
        filter_type: 'checkbox',
      },
    ],

    memory: [
      {
        name: 'memory_type',
        display_name: 'Тип памяти',
        description: 'DDR4 или DDR5',
        data_type: SpecificationDataType.MEMORY_TYPE,
        enum_values: Object.values(MemoryType),
        enum_source: 'MEMORY_TYPE',
        validation_rules: {
          required: true,
          dataType: SpecificationDataType.MEMORY_TYPE,
          compatibilityKey: true,
        },
        is_required: true,
        is_filterable: true,
        is_compatibility_key: true,
        display_order: 1,
        filter_order: 1,
        filter_type: 'checkbox',
      },
      {
        name: 'capacity',
        display_name: 'Объем',
        description: 'Объем одной планки памяти',
        data_type: SpecificationDataType.MEMORY_SIZE,
        enum_values: [],
        validation_rules: {
          required: true,
          dataType: SpecificationDataType.MEMORY_SIZE,
          minValue: 4,
          maxValue: 128,
          unit: 'GB',
        },
        is_required: true,
        is_filterable: true,
        is_compatibility_key: false,
        display_order: 2,
        filter_order: 2,
        filter_type: 'checkbox',
      },
      {
        name: 'frequency',
        display_name: 'Частота',
        description: 'Эффективная частота памяти',
        data_type: SpecificationDataType.FREQUENCY,
        enum_values: [],
        validation_rules: {
          required: true,
          dataType: SpecificationDataType.FREQUENCY,
          minValue: 2133,
          maxValue: 8000,
          unit: 'MHz',
        },
        is_required: true,
        is_filterable: true,
        is_compatibility_key: true,
        display_order: 3,
        filter_order: 3,
        filter_type: 'checkbox',
      },
      {
        name: 'modules_count',
        display_name: 'Количество модулей',
        description: 'Количество планок в комплекте',
        data_type: SpecificationDataType.NUMBER,
        enum_values: [],
        validation_rules: {
          required: true,
          dataType: SpecificationDataType.NUMBER,
          minValue: 1,
          maxValue: 8,
        },
        is_required: true,
        is_filterable: true,
        is_compatibility_key: false,
        display_order: 4,
        filter_order: 4,
        filter_type: 'checkbox',
      },
    ],
  };

  /**
   * ✅ СОЗДАНИЕ КАТЕГОРИИ С АВТОМАТИЧЕСКИМИ ТЕМПЛЕЙТАМИ
   */
  static async createCategoryWithTemplates(
    categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at'>,
    useStandardTemplates: boolean = true
  ): Promise<{
    success: boolean;
    categoryId?: string;
    templatesCreated?: number;
    errors?: string[];
  }> {
    try {
      console.log(`🏗️ Creating category: ${categoryData.name} (${categoryData.slug})`);

      // 1. Создаем категорию
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single();

      if (categoryError) {
        console.error('❌ Category creation failed:', categoryError);
        return {
          success: false,
          errors: [`Ошибка создания категории: ${categoryError.message}`],
        };
      }

      console.log(`✅ Category created with ID: ${category.id}`);

      // 2. Создаем стандартные темплейты (если нужно)
      let templatesCreated = 0;
      if (useStandardTemplates && this.CATEGORY_TEMPLATES[categoryData.slug]) {
        const templates = this.CATEGORY_TEMPLATES[categoryData.slug];

        console.log(`📋 Creating ${templates.length} standard templates for ${categoryData.slug}`);

        for (const templateData of templates) {
          const templateWithCategory: Omit<
            CategorySpecificationTemplate,
            'id' | 'created_at' | 'updated_at'
          > = {
            ...templateData,
            category_id: category.id,
          };

          const { error: templateError } = await supabase
            .from('category_specification_templates')
            .insert(templateWithCategory);

          if (templateError) {
            console.error(`❌ Template creation failed: ${templateData.name}`, templateError);
          } else {
            templatesCreated++;
            console.log(`✅ Template created: ${templateData.name}`);
          }
        }
      }

      return {
        success: true,
        categoryId: category.id,
        templatesCreated,
      };
    } catch (error) {
      console.error('❌ Unexpected error in createCategoryWithTemplates:', error);
      return {
        success: false,
        errors: [`Внутренняя ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * 📋 ПОЛУЧЕНИЕ СТАНДАРТНЫХ ТЕМПЛЕЙТОВ ДЛЯ КАТЕГОРИИ
   */
  static getStandardTemplatesForCategory(categorySlug: string): CategorySpecificationTemplate[] {
    return this.CATEGORY_TEMPLATES[categorySlug] || [];
  }

  /**
   * 🏷️ ПОЛУЧЕНИЕ ВСЕХ ПОДДЕРЖИВАЕМЫХ КАТЕГОРИЙ
   */
  static getSupportedCategories(): string[] {
    return Object.keys(this.CATEGORY_TEMPLATES);
  }

  /**
   * ✨ ИНИЦИАЛИЗАЦИЯ БАЗОВЫХ КАТЕГОРИЙ (для первого запуска)
   */
  static async initializeBasePCCategories(): Promise<{
    success: boolean;
    categoriesCreated: number;
    templatesCreated: number;
    errors: string[];
  }> {
    const baseCategories = [
      {
        name: 'Процессоры',
        slug: 'processors',
        description: 'Центральные процессоры для настольных ПК',
        is_subcategory: true,
        parent_id: null, // Должно быть установлено в реальной категории
      },
      {
        name: 'Материнские платы',
        slug: 'motherboards',
        description: 'Материнские платы для настольных ПК',
        is_subcategory: true,
        parent_id: null,
      },
      {
        name: 'Оперативная память',
        slug: 'memory',
        description: 'Модули оперативной памяти DDR4/DDR5',
        is_subcategory: true,
        parent_id: null,
      },
      {
        name: 'Видеокарты',
        slug: 'graphics-cards',
        description: 'Дискретные видеокарты',
        is_subcategory: true,
        parent_id: null,
      },
      {
        name: 'Блоки питания',
        slug: 'power-supplies',
        description: 'Блоки питания для ПК',
        is_subcategory: true,
        parent_id: null,
      },
    ];

    let categoriesCreated = 0;
    let templatesCreated = 0;
    const errors: string[] = [];

    for (const categoryData of baseCategories) {
      const result = await this.createCategoryWithTemplates(categoryData, true);

      if (result.success) {
        categoriesCreated++;
        templatesCreated += result.templatesCreated || 0;
      } else {
        errors.push(...(result.errors || []));
      }
    }

    return {
      success: errors.length === 0,
      categoriesCreated,
      templatesCreated,
      errors,
    };
  }
}
