/**
 * Новая простая система спецификаций
 * Типы данных для работы со спецификациями товаров
 */

// Базовые типы данных для спецификаций
export type SpecificationDataType = 'text' | 'number' | 'boolean' | 'enum';

// Интерфейс для темплейта спецификации категории
export interface SpecificationTemplate {
  id: string;
  category_id: string;
  name: string;
  display_name: string;
  data_type: SpecificationDataType;
  is_required: boolean;
  is_filter: boolean;
  display_order: number;
  enum_values?: string[];
  unit?: string;
  placeholder?: string;
  help_text?: string;
  created_at: string;
  updated_at: string;
}

// Интерфейс для спецификации продукта
export interface ProductSpecification {
  id: string;
  product_id: string;
  name: string;
  display_name: string;
  value: string;
  data_type: SpecificationDataType;
  is_required: boolean;
  is_filter: boolean;
  display_order: number;
  enum_values?: string[];
  unit?: string;
  created_at: string;
  updated_at: string;
}

// Интерфейс для создания нового темплейта
export interface CreateSpecificationTemplate {
  category_id: string;
  name: string;
  display_name: string;
  data_type: SpecificationDataType;
  is_required?: boolean;
  is_filter?: boolean;
  display_order?: number;
  enum_values?: string[];
  unit?: string;
  placeholder?: string;
  help_text?: string;
}

// Интерфейс для создания новой спецификации продукта
export interface CreateProductSpecification {
  product_id: string;
  name: string;
  display_name: string;
  value: string;
  data_type: SpecificationDataType;
  is_required?: boolean;
  is_filter?: boolean;
  display_order?: number;
  enum_values?: string[];
  unit?: string;
}

// Интерфейс для обновления темплейта
export interface UpdateSpecificationTemplate {
  display_name?: string;
  data_type?: SpecificationDataType;
  is_required?: boolean;
  is_filter?: boolean;
  display_order?: number;
  enum_values?: string[];
  unit?: string;
  placeholder?: string;
  help_text?: string;
}

// Интерфейс для обновления спецификации продукта
export interface UpdateProductSpecification {
  display_name?: string;
  value?: string;
  data_type?: SpecificationDataType;
  is_required?: boolean;
  is_filter?: boolean;
  display_order?: number;
  enum_values?: string[];
  unit?: string;
}

// Результат валидации спецификации
export interface SpecificationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  normalizedValue?: string | number | boolean;
}

// Результат операции с сервисом
export interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: string[];
  message?: string;
}

// Фильтр для спецификаций
export interface SpecificationFilter {
  name: string;
  display_name: string;
  data_type: SpecificationDataType;
  values?: string[];
  min_value?: number;
  max_value?: number;
  unit?: string;
}

// Группированные спецификации для отображения
export interface GroupedSpecifications {
  required: ProductSpecification[];
  optional: ProductSpecification[];
  all: ProductSpecification[];
}

// Данные для сравнения товаров
export interface ProductComparison {
  specifications: {
    [specName: string]: {
      display_name: string;
      values: { [productId: string]: string };
      data_type: SpecificationDataType;
      unit?: string;
    };
  };
  differences: string[];
  recommendations?: string[];
}

// Конфигурация для автоматического форматирования значений
export interface ValueFormattingConfig {
  data_type: SpecificationDataType;
  unit?: string;
  enum_values?: string[];
  decimal_places?: number;
}

// Предустановленные темплейты для категорий
export interface CategoryTemplatePreset {
  category_name: string;
  category_slug: string;
  templates: Omit<CreateSpecificationTemplate, 'category_id'>[];
}

// Статистика по спецификациям
export interface SpecificationStats {
  total_templates: number;
  total_specifications: number;
  categories_with_templates: number;
  products_with_specifications: number;
  most_used_specifications: Array<{
    name: string;
    display_name: string;
    usage_count: number;
  }>;
}

// Экспорт/импорт данных
export interface SpecificationExportData {
  templates: SpecificationTemplate[];
  specifications: ProductSpecification[];
  metadata: {
    export_date: string;
    version: string;
    categories: string[];
  };
}

// Настройки отображения спецификаций
export interface SpecificationDisplaySettings {
  show_units: boolean;
  group_by_type: boolean;
  show_empty_values: boolean;
  compact_mode: boolean;
  highlight_differences: boolean;
}