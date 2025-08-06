/**
 * Простые типы для новой системы спецификаций
 * Заменяет сложную старую систему
 */

// Базовые типы данных для спецификаций
export type SpecificationDataType = 'text' | 'number' | 'boolean' | 'enum';

// Результат валидации спецификации
export interface SpecificationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  normalizedValue?: string | number | boolean;
}

// Простой валидатор спецификаций
export class SimpleSpecificationValidator {
  /**
   * Валидировать значение спецификации
   */
  static validateValue(
    value: string,
    dataType: SpecificationDataType,
    isRequired: boolean = false,
    enumValues?: string[]
  ): SpecificationValidationResult {
    const errors: string[] = [];
    let normalizedValue: string | number | boolean = value;

    // Проверка обязательности
    if (isRequired && (!value || value.trim() === '')) {
      errors.push('Поле является обязательным');
    }

    // Валидация по типу данных
    switch (dataType) {
      case 'number':
        const numValue = parseFloat(value);
        if (value && isNaN(numValue)) {
          errors.push('Значение должно быть числом');
        } else if (!isNaN(numValue)) {
          normalizedValue = numValue;
        }
        break;

      case 'boolean':
        if (value && !['true', 'false', '1', '0', 'да', 'нет'].includes(value.toLowerCase())) {
          errors.push('Значение должно быть true или false');
        } else {
          normalizedValue = ['true', '1', 'да'].includes(value.toLowerCase());
        }
        break;

      case 'enum':
        if (value && enumValues && !enumValues.includes(value)) {
          errors.push(`Значение должно быть одним из: ${enumValues.join(', ')}`);
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
   * Валидировать набор спецификаций
   */
  static validateSpecifications(
    specifications: Record<string, string>,
    templates: Array<{
      name: string;
      data_type: SpecificationDataType;
      is_required: boolean;
      enum_values?: string[];
    }>
  ): Record<string, SpecificationValidationResult> {
    const results: Record<string, SpecificationValidationResult> = {};

    for (const template of templates) {
      const value = specifications[template.name] || '';
      results[template.name] = this.validateValue(
        value,
        template.data_type,
        template.is_required,
        template.enum_values
      );
    }

    return results;
  }
}

// Предустановленные значения для enum'ов
export const PRESET_ENUM_VALUES = {
  // Производители процессоров
  CPU_MANUFACTURERS: ['Intel', 'AMD', 'Apple', 'Qualcomm', 'MediaTek'],
  
  // Сокеты процессоров
  CPU_SOCKETS: ['AM4', 'AM5', 'LGA1700', 'LGA1200', 'LGA1151', 'LGA2066'],
  
  // Техпроцессы
  MANUFACTURING_PROCESSES: ['3nm', '4nm', '5nm', '7nm', '10nm', '14nm', '16nm', '22nm'],
  
  // Наборы инструкций
  INSTRUCTION_SETS: ['x86', 'x86-64', 'ARM', 'ARM64', 'RISC-V'],
  
  // Типы памяти
  MEMORY_TYPES: ['DDR4', 'DDR5', 'LPDDR4', 'LPDDR5'],
  
  // Производители видеокарт
  GPU_MANUFACTURERS: ['NVIDIA', 'AMD', 'Intel'],
  
  // Типы памяти видеокарт
  GPU_MEMORY_TYPES: ['GDDR6', 'GDDR6X', 'HBM2', 'HBM3'],
  
  // Форм-факторы материнских плат
  MOTHERBOARD_FORM_FACTORS: ['ATX', 'Micro-ATX', 'Mini-ITX', 'E-ATX'],
  
  // Форм-факторы блоков питания
  PSU_FORM_FACTORS: ['ATX', 'SFX', 'SFX-L', 'TFX'],
  
  // Сертификаты эффективности БП
  PSU_EFFICIENCY: ['80+ White', '80+ Bronze', '80+ Silver', '80+ Gold', '80+ Platinum', '80+ Titanium']
} as const;

// Утилиты для работы со спецификациями
export class SpecificationUtils {
  /**
   * Форматировать значение для отображения
   */
  static formatValue(
    value: string,
    dataType: SpecificationDataType,
    unit?: string
  ): string {
    if (!value || value === '') return 'Не указано';

    switch (dataType) {
      case 'boolean':
        return ['true', '1', 'да'].includes(value.toLowerCase()) ? 'Да' : 'Нет';
      
      case 'number':
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return value;
        return unit ? `${numValue} ${unit}` : numValue.toString();
      
      default:
        return value;
    }
  }

  /**
   * Получить предустановленные значения для enum'а
   */
  static getPresetEnumValues(enumType: keyof typeof PRESET_ENUM_VALUES): string[] {
    return [...PRESET_ENUM_VALUES[enumType]];
  }

  /**
   * Проверить, является ли значение пустым
   */
  static isEmpty(value: unknown): boolean {
    return value === null || value === undefined || String(value).trim() === '';
  }

  /**
   * Нормализовать строковое значение
   */
  static normalizeStringValue(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  /**
   * Парсить числовое значение
   */
  static parseNumber(value: string): number | null {
    if (typeof value === 'number') {
      return isNaN(value) ? null : value;
    }
    
    const str = String(value).trim();
    if (str === '') return null;
    
    // Удаляем единицы измерения и другие символы
    const cleanStr = str.replace(/[^\d.,\-+]/g, '');
    const num = parseFloat(cleanStr.replace(',', '.'));
    
    return isNaN(num) ? null : num;
  }
}

// Экспорт для обратной совместимости (если где-то используются старые типы)
export type { SpecificationDataType as DataType };
export { SimpleSpecificationValidator as SpecificationValidator };