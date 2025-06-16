export interface TypedSpecificationValue {
  textValue?: string;
  numberValue?: number;
  enumValue?: string;
  booleanValue?: boolean;
  unit?: string;
}

export interface SpecificationValidationRule {
  required?: boolean;
  dataType: SpecificationDataType;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  enumValues?: string[];
  unit?: string;
  compatibilityKey?: boolean; // Используется для проверки совместимости
}

export enum SpecificationDataType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  ENUM = 'ENUM',
  BOOLEAN = 'BOOLEAN',
  SOCKET = 'SOCKET',
  MEMORY_TYPE = 'MEMORY_TYPE',
  POWER_CONNECTOR = 'POWER_CONNECTOR',
  FREQUENCY = 'FREQUENCY',
  MEMORY_SIZE = 'MEMORY_SIZE',
  POWER_CONSUMPTION = 'POWER_CONSUMPTION',
  CHIPSET = 'CHIPSET',
}

export enum SocketType {
  AM4 = 'AM4',
  AM5 = 'AM5',
  LGA1700 = 'LGA1700',
  LGA1200 = 'LGA1200',
  LGA1151 = 'LGA1151',
  LGA2066 = 'LGA2066',
}

export enum MemoryType {
  DDR4 = 'DDR4',
  DDR5 = 'DDR5',
}

export enum ChipsetType {
  // AMD Chipsets
  B450 = 'B450',
  B550 = 'B550',
  X570 = 'X570',
  X670E = 'X670E',
  B650 = 'B650',
  B650E = 'B650E',
  X670 = 'X670',

  // Intel Chipsets
  B560 = 'B560',
  Z490 = 'Z490',
  Z590 = 'Z590',
  B660 = 'B660',
  B760 = 'B760',
  H610 = 'H610',
  H670 = 'H670',
  H770 = 'H770',
  Z690 = 'Z690',
  Z790 = 'Z790',
}

export enum MemorySpeedDDR4 {
  DDR4_2133 = 'DDR4-2133',
  DDR4_2400 = 'DDR4-2400',
  DDR4_2666 = 'DDR4-2666',
  DDR4_2933 = 'DDR4-2933',
  DDR4_3200 = 'DDR4-3200',
  DDR4_3600 = 'DDR4-3600',
}

export enum MemorySpeedDDR5 {
  DDR5_4800 = 'DDR5-4800',
  DDR5_5200 = 'DDR5-5200',
  DDR5_5600 = 'DDR5-5600',
  DDR5_6000 = 'DDR5-6000',
  DDR5_6400 = 'DDR5-6400',
}

export enum FormFactor {
  ATX = 'ATX',
  MICRO_ATX = 'Micro ATX',
  MINI_ITX = 'Mini ITX',
  E_ATX = 'E-ATX',
}

export interface SpecificationValidationResult {
  isValid: boolean;
  normalizedValue: TypedSpecificationValue;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

export class SpecificationValidator {
  /**
   * ГЛАВНЫЙ метод валидации - превращает произвольный ввод в типизированное значение
   */
  static validateAndNormalize(
    rawValue: any,
    rule: SpecificationValidationRule,
    context?: Record<string, TypedSpecificationValue> // Контекст других спецификаций
  ): SpecificationValidationResult {
    const result: SpecificationValidationResult = {
      isValid: true,
      normalizedValue: {},
      errors: [],
      warnings: [],
      suggestions: [],
    };

    // Проверка обязательности
    if (rule.required && this.isEmpty(rawValue)) {
      result.isValid = false;
      result.errors.push(`Поле "${rule.dataType}" обязательно для заполнения`);
      return result;
    }

    // Пропускаем пустые необязательные поля
    if (this.isEmpty(rawValue)) {
      return result;
    }

    // Валидация по типу данных
    switch (rule.dataType) {
      case SpecificationDataType.SOCKET:
        return this.validateSocket(rawValue, rule, context);

      case SpecificationDataType.MEMORY_TYPE:
        return this.validateMemoryType(rawValue, rule, context);

      case SpecificationDataType.FREQUENCY:
        return this.validateFrequency(rawValue, rule);

      case SpecificationDataType.MEMORY_SIZE:
        return this.validateMemorySize(rawValue, rule);

      case SpecificationDataType.POWER_CONSUMPTION:
        return this.validatePower(rawValue, rule);

      case SpecificationDataType.CHIPSET:
        return this.validateChipset(rawValue, rule, context);

      case SpecificationDataType.ENUM:
        return this.validateEnum(rawValue, rule);

      case SpecificationDataType.NUMBER:
        return this.validateNumber(rawValue, rule);

      case SpecificationDataType.BOOLEAN:
        return this.validateBoolean(rawValue, rule);

      default:
        return this.validateText(rawValue, rule);
    }
  }

  /**
   * Валидация сокета процессора
   */
  private static validateSocket(
    rawValue: any,
    rule: SpecificationValidationRule,
    context?: Record<string, TypedSpecificationValue>
  ): SpecificationValidationResult {
    const result: SpecificationValidationResult = {
      isValid: true,
      normalizedValue: {},
      errors: [],
      warnings: [],
      suggestions: [],
    };

    // Нормализация входного значения
    const normalizedInput = String(rawValue).trim().toUpperCase();

    // Маппинг различных вариантов написания к стандартным
    const socketMapping: Record<string, SocketType> = {
      LGA1700: SocketType.LGA1700,
      'LGA 1700': SocketType.LGA1700,
      'LGA-1700': SocketType.LGA1700,
      'INTEL LGA1700': SocketType.LGA1700,
      'SOCKET 1700': SocketType.LGA1700,

      AM4: SocketType.AM4,
      'SOCKET AM4': SocketType.AM4,
      'AMD AM4': SocketType.AM4,

      AM5: SocketType.AM5,
      'SOCKET AM5': SocketType.AM5,
      'AMD AM5': SocketType.AM5,

      LGA1200: SocketType.LGA1200,
      'LGA 1200': SocketType.LGA1200,
      'LGA-1200': SocketType.LGA1200,

      LGA1151: SocketType.LGA1151,
      'LGA 1151': SocketType.LGA1151,
      'LGA-1151': SocketType.LGA1151,
    };

    const mappedSocket = socketMapping[normalizedInput];

    if (!mappedSocket) {
      result.isValid = false;
      result.errors.push(
        `Неизвестный сокет: "${rawValue}". Поддерживаемые: ${Object.values(SocketType).join(', ')}`
      );
      result.suggestions = Object.values(SocketType);
      return result;
    }

    result.normalizedValue.enumValue = mappedSocket;

    // БИЗНЕС-ЛОГИКА: Проверка совместимости с памятью
    if (context?.memory_type?.enumValue) {
      const memoryType = context.memory_type.enumValue as MemoryType;
      const compatibleMemory = SOCKET_MEMORY_COMPATIBILITY[mappedSocket];

      if (!compatibleMemory.includes(memoryType)) {
        result.warnings.push(
          `⚠️ Сокет ${mappedSocket} не совместим с памятью ${memoryType}. ` +
            `Поддерживаемые типы: ${compatibleMemory.join(', ')}`
        );
      }
    }

    return result;
  }

  /**
   * Валидация частоты с автоконвертацией единиц
   */
  private static validateFrequency(
    rawValue: any,
    rule: SpecificationValidationRule
  ): SpecificationValidationResult {
    const result: SpecificationValidationResult = {
      isValid: true,
      normalizedValue: {},
      errors: [],
      warnings: [],
      suggestions: [],
    };

    const input = String(rawValue).trim();

    // Регулярка для парсинга частоты
    const frequencyRegex = /^(\d+(?:\.\d+)?)\s*(mhz|ghz|МГц|ГГц)?$/i;
    const match = input.match(frequencyRegex);

    if (!match) {
      result.isValid = false;
      result.errors.push(
        `Неверный формат частоты: "${rawValue}". Примеры: "3200", "3.2 GHz", "3200 MHz"`
      );
      return result;
    }

    let frequency = parseFloat(match[1]);
    const unit = match[2]?.toLowerCase();

    // Автоконвертация в MHz
    if (unit === 'ghz' || unit === 'ггц') {
      frequency = frequency * 1000;
    }

    // Проверка диапазона
    if (rule.minValue && frequency < rule.minValue) {
      result.isValid = false;
      result.errors.push(`Частота слишком низкая: ${frequency} MHz. Минимум: ${rule.minValue} MHz`);
    }

    if (rule.maxValue && frequency > rule.maxValue) {
      result.isValid = false;
      result.errors.push(
        `Частота слишком высокая: ${frequency} MHz. Максимум: ${rule.maxValue} MHz`
      );
    }

    result.normalizedValue.numberValue = frequency;
    result.normalizedValue.unit = 'MHz';

    return result;
  }

  /**
   * Валидация размера памяти с автоконвертацией
   */
  private static validateMemorySize(
    rawValue: any,
    rule: SpecificationValidationRule
  ): SpecificationValidationResult {
    const result: SpecificationValidationResult = {
      isValid: true,
      normalizedValue: {},
      errors: [],
      warnings: [],
      suggestions: [],
    };

    const input = String(rawValue).trim();

    // Регулярка для парсинга размера
    const sizeRegex = /^(\d+(?:\.\d+)?)\s*(gb|tb|гб|тб|mb|мб)?$/i;
    const match = input.match(sizeRegex);

    if (!match) {
      result.isValid = false;
      result.errors.push(`Неверный формат размера: "${rawValue}". Примеры: "16", "16 GB", "1 TB"`);
      return result;
    }

    let size = parseFloat(match[1]);
    const unit = match[2]?.toLowerCase();

    // Автоконвертация в GB
    if (unit === 'tb' || unit === 'тб') {
      size = size * 1024;
    } else if (unit === 'mb' || unit === 'мб') {
      size = size / 1024;
    }

    // Проверка разумных диапазонов
    if (size < 0.5) {
      result.warnings.push(`Очень маленький размер памяти: ${size} GB`);
    }

    if (size > 1024) {
      // Больше 1TB
      result.warnings.push(`Очень большой размер памяти: ${size} GB`);
    }

    result.normalizedValue.numberValue = size;
    result.normalizedValue.unit = 'GB';

    return result;
  }

  /**
   * Валидация чипсета с проверкой совместимости
   */
  private static validateChipset(
    rawValue: any,
    rule: SpecificationValidationRule,
    context?: Record<string, TypedSpecificationValue>
  ): SpecificationValidationResult {
    const result: SpecificationValidationResult = {
      isValid: true,
      normalizedValue: {},
      errors: [],
      warnings: [],
      suggestions: [],
    };

    const normalizedInput = String(rawValue).trim().toUpperCase();

    // Попытка найти чипсет в enum
    const chipset = Object.values(ChipsetType).find(
      c =>
        c.toUpperCase() === normalizedInput ||
        c.replace(/[_-]/g, '').toUpperCase() === normalizedInput.replace(/[_-]/g, '')
    );

    if (!chipset) {
      result.isValid = false;
      result.errors.push(
        `Неизвестный чипсет: "${rawValue}". Поддерживаемые: ${Object.values(ChipsetType).join(', ')}`
      );
      result.suggestions = Object.values(ChipsetType);
      return result;
    }

    result.normalizedValue.enumValue = chipset;

    // БИЗНЕС-ЛОГИКА: Проверка совместимости с сокетом
    if (context?.socket?.enumValue) {
      const socket = context.socket.enumValue as SocketType;
      const compatibleSockets = CHIPSET_SOCKET_COMPATIBILITY[chipset as ChipsetType];

      if (!compatibleSockets.includes(socket)) {
        result.isValid = false;
        result.errors.push(
          `❌ Чипсет ${chipset} не совместим с сокетом ${socket}. ` +
            `Поддерживаемые сокеты: ${compatibleSockets.join(', ')}`
        );
      }
    }

    return result;
  }

  // Остальные методы валидации...
  private static validateEnum(
    rawValue: any,
    rule: SpecificationValidationRule
  ): SpecificationValidationResult {
    const result: SpecificationValidationResult = {
      isValid: true,
      normalizedValue: {},
      errors: [],
      warnings: [],
    };

    const value = String(rawValue).trim();

    if (rule.enumValues && !rule.enumValues.includes(value)) {
      result.isValid = false;
      result.errors.push(
        `Недопустимое значение: "${value}". Доступные: ${rule.enumValues.join(', ')}`
      );
      result.suggestions = rule.enumValues;
    } else {
      result.normalizedValue.enumValue = value;
    }

    return result;
  }

  private static validateNumber(
    rawValue: any,
    rule: SpecificationValidationRule
  ): SpecificationValidationResult {
    const result: SpecificationValidationResult = {
      isValid: true,
      normalizedValue: {},
      errors: [],
      warnings: [],
    };

    const num = Number(rawValue);

    if (isNaN(num)) {
      result.isValid = false;
      result.errors.push(`"${rawValue}" не является числом`);
      return result;
    }

    if (rule.minValue !== undefined && num < rule.minValue) {
      result.isValid = false;
      result.errors.push(`Значение ${num} меньше минимального ${rule.minValue}`);
    }

    if (rule.maxValue !== undefined && num > rule.maxValue) {
      result.isValid = false;
      result.errors.push(`Значение ${num} больше максимального ${rule.maxValue}`);
    }

    result.normalizedValue.numberValue = num;
    result.normalizedValue.unit = rule.unit;

    return result;
  }

  private static validateBoolean(
    rawValue: any,
    rule: SpecificationValidationRule
  ): SpecificationValidationResult {
    const result: SpecificationValidationResult = {
      isValid: true,
      normalizedValue: {},
      errors: [],
      warnings: [],
    };

    // Нормализация булевых значений
    const truthyValues = ['true', '1', 'yes', 'да', 'есть', 'on', 'enabled'];
    const falsyValues = ['false', '0', 'no', 'нет', 'off', 'disabled'];

    const normalized = String(rawValue).toLowerCase().trim();

    if (truthyValues.includes(normalized)) {
      result.normalizedValue.booleanValue = true;
    } else if (falsyValues.includes(normalized)) {
      result.normalizedValue.booleanValue = false;
    } else {
      result.isValid = false;
      result.errors.push(
        `"${rawValue}" не является булевым значением. Используйте: true/false, yes/no, 1/0`
      );
    }

    return result;
  }

  private static validateText(
    rawValue: any,
    rule: SpecificationValidationRule
  ): SpecificationValidationResult {
    const result: SpecificationValidationResult = {
      isValid: true,
      normalizedValue: {},
      errors: [],
      warnings: [],
    };

    const text = String(rawValue).trim();

    // Проверка по регулярному выражению
    if (rule.pattern) {
      const regex = new RegExp(rule.pattern);
      if (!regex.test(text)) {
        result.isValid = false;
        result.errors.push(`Значение "${text}" не соответствует требуемому формату`);
      }
    }

    result.normalizedValue.textValue = text;
    return result;
  }

  private static isEmpty(value: any): boolean {
    return value === null || value === undefined || String(value).trim() === '';
  }

  /**
   * Валидация всего набора спецификаций с кросс-проверками
   */
  static validateSpecificationSet(
    specifications: Record<string, any>,
    rules: Record<string, SpecificationValidationRule>
  ): Record<string, SpecificationValidationResult> {
    const results: Record<string, SpecificationValidationResult> = {};
    const context: Record<string, TypedSpecificationValue> = {};

    // Первый проход - валидация отдельных полей
    Object.entries(specifications).forEach(([key, value]) => {
      const rule = rules[key];
      if (rule) {
        results[key] = this.validateAndNormalize(value, rule);
        if (results[key].isValid) {
          context[key] = results[key].normalizedValue;
        }
      }
    });

    // Второй проход - кросс-валидация с контекстом
    Object.entries(specifications).forEach(([key, value]) => {
      const rule = rules[key];
      if (rule && rule.compatibilityKey) {
        results[key] = this.validateAndNormalize(value, rule, context);
      }
    });

    return results;
  }
}

// Интерфейсы для совместимости (перенесены из compatibility/specifications.ts)
export interface CompatibilityIssue {
  type: 'error' | 'warning';
  component1: string;
  component2: string;
  message: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValidationResult {
  isValid: boolean;
  issues: CompatibilityIssue[];
  warnings: CompatibilityIssue[];
  powerConsumption?: number;
}

export interface EnhancedPCConfiguration {
  components: Record<string, string | string[]>;
  compatibilityStatus: 'valid' | 'warning' | 'error';
  totalPrice?: number;
  powerConsumption?: number;
}

export interface EnumMetadata {
  name: string;
  values: readonly string[];
  displayNames?: Record<string, string>;
  description?: string;
}

export const SPECIFICATION_ENUMS: Record<string, EnumMetadata> = {
  SOCKET_TYPE: {
    name: 'SocketType',
    values: Object.values(SocketType),
    displayNames: {
      [SocketType.AM4]: 'AMD AM4',
      [SocketType.AM5]: 'AMD AM5',
      [SocketType.LGA1700]: 'Intel LGA 1700',
      [SocketType.LGA1200]: 'Intel LGA 1200',
      [SocketType.LGA1151]: 'Intel LGA 1151',
      [SocketType.LGA2066]: 'Intel LGA 2066',
    },
    description: 'Сокеты процессоров и материнских плат',
  },
  MEMORY_TYPE: {
    name: 'MemoryType',
    values: Object.values(MemoryType),
    displayNames: {
      [MemoryType.DDR4]: 'DDR4',
      [MemoryType.DDR5]: 'DDR5',
    },
    description: 'Типы оперативной памяти',
  },
  CHIPSET_TYPE: {
    name: 'ChipsetType',
    values: Object.values(ChipsetType),
    description: 'Чипсеты материнских плат',
  },
  FORM_FACTOR: {
    name: 'FormFactor',
    values: Object.values(FormFactor),
    description: 'Форм-факторы компонентов',
  },
  MEMORY_SPEED_DDR4: {
    name: 'MemorySpeedDDR4',
    values: Object.values(MemorySpeedDDR4),
    description: 'Скорости памяти DDR4',
  },
  MEMORY_SPEED_DDR5: {
    name: 'MemorySpeedDDR5',
    values: Object.values(MemorySpeedDDR5),
    description: 'Скорости памяти DDR5',
  },
} as const;
