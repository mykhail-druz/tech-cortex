import {
  ProductSpecification,
  CategorySpecificationTemplate,
  SpecificationValidationResult,
  SpecificationDataType,
  SocketType,
  MemoryType,
  ChipsetType,
  SpecificationValidator,
} from '@/lib/supabase/types/specifications';

/**
 * Валидатор спецификаций продуктов
 * Обеспечивает соответствие значений продуктов шаблонам и enum'ам
 */
export class ProductSpecValidator {
  /**
   * ГЛАВНАЯ ФУНКЦИЯ: Валидация спецификации продукта
   */
  static validateProductSpecification(
    spec: Partial<ProductSpecification>,
    template: CategorySpecificationTemplate
  ): SpecificationValidationResult {
    // Для критически важных полей - строгая проверка
    if (template.is_compatibility_key) {
      switch (template.data_type) {
        case SpecificationDataType.SOCKET:
          return this.validateSocketValue(spec.value_enum, template);

        case SpecificationDataType.MEMORY_TYPE:
          return this.validateMemoryTypeValue(spec.value_enum, template);

        case SpecificationDataType.CHIPSET:
          return this.validateChipsetValue(spec.value_enum, template);
      }
    }

    // Для остальных - базовая валидация через SpecificationValidator
    const value = spec.value_enum || spec.value_number || spec.value_text || spec.value_boolean;

    return SpecificationValidator.validateAndNormalize(value, template.validation_rules);
  }

  /**
   * Валидация множественных спецификаций продукта
   */
  static validateProductSpecifications(
    specs: Partial<ProductSpecification>[],
    templates: CategorySpecificationTemplate[]
  ): { isValid: boolean; results: SpecificationValidationResult[]; errors: string[] } {
    const results: SpecificationValidationResult[] = [];
    const errors: string[] = [];

    // Проверяем каждую спецификацию
    specs.forEach((spec, index) => {
      const template = templates.find(t => t.id === spec.template_id);
      if (!template) {
        errors.push(`Шаблон не найден для спецификации ${index + 1}`);
        return;
      }

      const result = this.validateProductSpecification(spec, template);
      results.push(result);

      if (!result.isValid) {
        errors.push(`Спецификация "${template.display_name}": ${result.errors.join(', ')}`);
      }
    });

    // Проверяем наличие всех обязательных спецификаций
    const requiredTemplates = templates.filter(t => t.is_required);
    const providedTemplateIds = specs.map(s => s.template_id).filter(Boolean);

    requiredTemplates.forEach(template => {
      if (!providedTemplateIds.includes(template.id)) {
        errors.push(`Отсутствует обязательная спецификация: ${template.display_name}`);
      }
    });

    return {
      isValid: errors.length === 0,
      results,
      errors,
    };
  }

  /**
   * Строгая валидация сокета
   */
  private static validateSocketValue(
    value: string | undefined,
    template: CategorySpecificationTemplate
  ): SpecificationValidationResult {
    if (!value) {
      return {
        isValid: false,
        errors: ['Сокет обязателен для заполнения'],
        warnings: [],
        normalizedValue: {},
      };
    }

    // Проверяем что значение есть в enum'е
    if (!Object.values(SocketType).includes(value as SocketType)) {
      return {
        isValid: false,
        errors: [
          `Недопустимый сокет: ${value}. Разрешены: ${Object.values(SocketType).join(', ')}`,
        ],
        warnings: [],
        normalizedValue: {},
        suggestions: Object.values(SocketType),
      };
    }

    // Проверяем против шаблона
    if (template.enum_values && !template.enum_values.includes(value)) {
      return {
        isValid: false,
        errors: [
          `Сокет ${value} не разрешён для этой категории. Разрешены: ${template.enum_values.join(', ')}`,
        ],
        warnings: [],
        normalizedValue: {},
        suggestions: template.enum_values,
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: [],
      normalizedValue: { enumValue: value },
    };
  }

  /**
   * Строгая валидация типа памяти
   */
  private static validateMemoryTypeValue(
    value: string | undefined,
    template: CategorySpecificationTemplate
  ): SpecificationValidationResult {
    if (!value) {
      return {
        isValid: false,
        errors: ['Тип памяти обязателен для заполнения'],
        warnings: [],
        normalizedValue: {},
      };
    }

    if (!Object.values(MemoryType).includes(value as MemoryType)) {
      return {
        isValid: false,
        errors: [
          `Недопустимый тип памяти: ${value}. Разрешены: ${Object.values(MemoryType).join(', ')}`,
        ],
        warnings: [],
        normalizedValue: {},
        suggestions: Object.values(MemoryType),
      };
    }

    if (template.enum_values && !template.enum_values.includes(value)) {
      return {
        isValid: false,
        errors: [
          `Тип памяти ${value} не разрешён для этой категории. Разрешены: ${template.enum_values.join(', ')}`,
        ],
        warnings: [],
        normalizedValue: {},
        suggestions: template.enum_values,
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: [],
      normalizedValue: { enumValue: value },
    };
  }

  /**
   * Строгая валидация чипсета
   */
  private static validateChipsetValue(
    value: string | undefined,
    template: CategorySpecificationTemplate
  ): SpecificationValidationResult {
    if (!value) {
      return {
        isValid: false,
        errors: ['Чипсет обязателен для заполнения'],
        warnings: [],
        normalizedValue: {},
      };
    }

    if (!Object.values(ChipsetType).includes(value as ChipsetType)) {
      return {
        isValid: false,
        errors: [
          `Недопустимый чипсет: ${value}. Разрешены: ${Object.values(ChipsetType).join(', ')}`,
        ],
        warnings: [],
        normalizedValue: {},
        suggestions: Object.values(ChipsetType),
      };
    }

    if (template.enum_values && !template.enum_values.includes(value)) {
      return {
        isValid: false,
        errors: [
          `Чипсет ${value} не разрешён для этой категории. Разрешены: ${template.enum_values.join(', ')}`,
        ],
        warnings: [],
        normalizedValue: {},
        suggestions: template.enum_values,
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: [],
      normalizedValue: { enumValue: value },
    };
  }

  /**
   * Получение подсказок для автодополнения
   */
  static getAutocompleteValues(template: CategorySpecificationTemplate): string[] {
    if (template.enum_values && template.enum_values.length > 0) {
      return template.enum_values;
    }

    switch (template.data_type) {
      case SpecificationDataType.SOCKET:
        return Object.values(SocketType);
      case SpecificationDataType.MEMORY_TYPE:
        return Object.values(MemoryType);
      case SpecificationDataType.CHIPSET:
        return Object.values(ChipsetType);
      default:
        return [];
    }
  }
}
