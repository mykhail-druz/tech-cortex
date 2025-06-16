import {
  CategorySpecificationTemplate,
  SpecificationDataType,
  SPECIFICATION_ENUMS,
  ValidationResult,
} from '@/lib/supabase/types/specifications';

/**
 * Валидатор шаблонов спецификаций
 * Обеспечивает типобезопасность при создании шаблонов
 */
export class TemplateValidator {
  /**
   * Валидация шаблона спецификации при создании
   */
  static validateTemplate(template: Partial<CategorySpecificationTemplate>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Проверка обязательных полей
    if (!template.name) {
      errors.push('Название шаблона обязательно');
    }

    if (!template.display_name) {
      errors.push('Отображаемое название обязательно');
    }

    if (!template.data_type) {
      errors.push('Тип данных обязателен');
    }

    // Проверка enum'ов для критически важных полей
    if (template.data_type === SpecificationDataType.SOCKET) {
      if (!template.enum_source || template.enum_source !== 'SOCKET_TYPE') {
        errors.push('Для сокетов необходимо указать enum_source: SOCKET_TYPE');
      }

      if (template.enum_values) {
        const validValues = SPECIFICATION_ENUMS.SOCKET_TYPE.values;
        const invalidValues = template.enum_values.filter(v => !validValues.includes(v));
        if (invalidValues.length > 0) {
          errors.push(`Недопустимые значения сокетов: ${invalidValues.join(', ')}`);
        }
      }
    }

    if (template.data_type === SpecificationDataType.MEMORY_TYPE) {
      if (!template.enum_source || template.enum_source !== 'MEMORY_TYPE') {
        errors.push('Для типов памяти необходимо указать enum_source: MEMORY_TYPE');
      }

      if (template.enum_values) {
        const validValues = SPECIFICATION_ENUMS.MEMORY_TYPE.values;
        const invalidValues = template.enum_values.filter(v => !validValues.includes(v));
        if (invalidValues.length > 0) {
          errors.push(`Недопустимые типы памяти: ${invalidValues.join(', ')}`);
        }
      }
    }

    if (template.data_type === SpecificationDataType.CHIPSET) {
      if (!template.enum_source || template.enum_source !== 'CHIPSET_TYPE') {
        errors.push('Для чипсетов необходимо указать enum_source: CHIPSET_TYPE');
      }

      if (template.enum_values) {
        const validValues = SPECIFICATION_ENUMS.CHIPSET_TYPE.values;
        const invalidValues = template.enum_values.filter(v => !validValues.includes(v));
        if (invalidValues.length > 0) {
          errors.push(`Недопустимые чипсеты: ${invalidValues.join(', ')}`);
        }
      }
    }

    // Проверка логики совместимости
    if (template.is_compatibility_key && !template.is_required) {
      warnings.push('Ключи совместимости обычно должны быть обязательными');
    }

    if (template.is_compatibility_key && !template.is_filterable) {
      warnings.push('Ключи совместимости рекомендуется делать фильтруемыми');
    }

    return {
      isValid: errors.length === 0,
      issues: errors.map(error => ({
        type: 'error' as const,
        component1: 'Template',
        component2: 'Validation',
        message: error,
        details: '',
        severity: 'high' as const,
      })),
      warnings: warnings.map(warning => ({
        type: 'warning' as const,
        component1: 'Template',
        component2: 'Validation',
        message: warning,
        details: '',
        severity: 'medium' as const,
      })),
    };
  }

  /**
   * Автоматическое заполнение enum_values из enum_source
   */
  static autoFillEnumValues(template: Partial<CategorySpecificationTemplate>): void {
    if (template.enum_source && SPECIFICATION_ENUMS[template.enum_source]) {
      template.enum_values = [...SPECIFICATION_ENUMS[template.enum_source].values];
    }
  }

  /**
   * Получить рекомендуемые настройки для типа данных
   */
  static getRecommendedSettings(
    dataType: SpecificationDataType
  ): Partial<CategorySpecificationTemplate> {
    const recommendations: Record<SpecificationDataType, Partial<CategorySpecificationTemplate>> = {
      [SpecificationDataType.SOCKET]: {
        enum_source: 'SOCKET_TYPE',
        is_required: true,
        is_compatibility_key: true,
        is_filterable: true,
        filter_type: 'checkbox',
      },
      [SpecificationDataType.MEMORY_TYPE]: {
        enum_source: 'MEMORY_TYPE',
        is_required: true,
        is_compatibility_key: true,
        is_filterable: true,
        filter_type: 'checkbox',
      },
      [SpecificationDataType.CHIPSET]: {
        enum_source: 'CHIPSET_TYPE',
        is_required: true,
        is_compatibility_key: true,
        is_filterable: true,
        filter_type: 'dropdown',
      },
      [SpecificationDataType.FREQUENCY]: {
        is_filterable: true,
        filter_type: 'range',
      },
      [SpecificationDataType.POWER_CONSUMPTION]: {
        is_filterable: true,
        filter_type: 'range',
      },
      [SpecificationDataType.NUMBER]: {
        is_filterable: true,
        filter_type: 'range',
      },
      [SpecificationDataType.ENUM]: {
        is_filterable: true,
        filter_type: 'checkbox',
      },
      [SpecificationDataType.BOOLEAN]: {
        is_filterable: true,
        filter_type: 'checkbox',
      },
      [SpecificationDataType.TEXT]: {
        is_filterable: false,
      },
      [SpecificationDataType.MEMORY_SIZE]: {
        is_filterable: true,
        filter_type: 'range',
      },
      [SpecificationDataType.POWER_CONNECTOR]: {
        is_filterable: true,
        filter_type: 'checkbox',
      },
    };

    return recommendations[dataType] || {};
  }
}
