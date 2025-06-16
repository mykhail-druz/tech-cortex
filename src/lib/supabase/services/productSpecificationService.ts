import { supabase } from '@/lib/supabaseClient';
import {
  Product,
  ProductSpecification,
  CategorySpecificationTemplate,
} from '@/lib/supabase/types/types';
import {
  SpecificationValidator,
  SpecificationValidationResult,
  TypedSpecificationValue,
  SpecificationDataType,
} from '@/lib/supabase/types/specifications';
import { TemplateService } from './templateService';

/**
 * 🎯 СЕРВИС СОЗДАНИЯ ТОВАРОВ С ТИПИЗИРОВАННЫМИ СПЕЦИФИКАЦИЯМИ
 * Создание, валидация и управление спецификациями продуктов
 */
export class ProductSpecificationService {
  /**
   * ✅ СОЗДАНИЕ ПРОДУКТА С ВАЛИДИРОВАННЫМИ СПЕЦИФИКАЦИЯМИ
   */
  static async createProductWithSpecifications(
    productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>,
    specifications: Record<string, any> // Ключ = template.name, значение = пользовательский ввод
  ): Promise<{
    success: boolean;
    productId?: string;
    specificationsCreated?: number;
    errors?: string[];
    warnings?: string[];
    validationDetails?: Record<string, SpecificationValidationResult>;
  }> {
    try {
      console.log(`🏗️ Creating product: ${productData.title}`);
      console.log(`📋 With specifications:`, Object.keys(specifications));

      // 1. Определяем категорию для получения темплейтов
      const categoryId = productData.subcategory_id || productData.category_id;
      if (!categoryId) {
        return {
          success: false,
          errors: ['Необходимо указать категорию или подкатегорию товара'],
        };
      }

      // 2. Получаем темплейты категории
      const templatesResult = await TemplateService.getTemplatesForCategory(categoryId);
      if (!templatesResult.success || !templatesResult.templates) {
        return {
          success: false,
          errors: templatesResult.errors || ['Не удалось получить темплейты категории'],
        };
      }

      const templates = templatesResult.templates;
      console.log(`📝 Found ${templates.length} templates for category`);

      // 3. Валидируем все спецификации
      const validationResult = await this.validateProductSpecifications(specifications, templates);

      if (!validationResult.success) {
        return {
          success: false,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          validationDetails: validationResult.validationDetails,
        };
      }

      // 4. Создаем продукт
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (productError) {
        console.error('❌ Product creation failed:', productError);
        return {
          success: false,
          errors: [`Ошибка создания товара: ${productError.message}`],
        };
      }

      console.log(`✅ Product created with ID: ${product.id}`);

      // 5. Создаем спецификации
      const specificationsResult = await this.createProductSpecifications(
        product.id,
        validationResult.normalizedSpecifications!,
        templates
      );

      if (!specificationsResult.success) {
        // Если спецификации не удалось создать, удаляем продукт
        await supabase.from('products').delete().eq('id', product.id);
        return {
          success: false,
          errors: specificationsResult.errors || ['Ошибка создания спецификаций'],
        };
      }

      return {
        success: true,
        productId: product.id,
        specificationsCreated: specificationsResult.specificationsCreated,
        warnings: validationResult.warnings,
        validationDetails: validationResult.validationDetails,
      };
    } catch (error) {
      console.error('❌ Unexpected error in createProductWithSpecifications:', error);
      return {
        success: false,
        errors: [`Внутренняя ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * 🔍 ВАЛИДАЦИЯ СПЕЦИФИКАЦИЙ ПРОДУКТА
   */
  private static async validateProductSpecifications(
    specifications: Record<string, any>,
    templates: CategorySpecificationTemplate[]
  ): Promise<{
    success: boolean;
    errors?: string[];
    warnings?: string[];
    validationDetails?: Record<string, SpecificationValidationResult>;
    normalizedSpecifications?: Record<string, TypedSpecificationValue>;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const validationDetails: Record<string, SpecificationValidationResult> = {};
    const normalizedSpecifications: Record<string, TypedSpecificationValue> = {};

    // Создаем мапу темплейтов по имени для быстрого доступа
    const templateMap = new Map<string, CategorySpecificationTemplate>();
    templates.forEach(template => {
      templateMap.set(template.name, template);
    });

    // 1. Проверяем обязательные поля
    const requiredTemplates = templates.filter(t => t.is_required);
    for (const template of requiredTemplates) {
      if (
        !(template.name in specifications) ||
        specifications[template.name] === null ||
        specifications[template.name] === undefined ||
        specifications[template.name] === ''
      ) {
        errors.push(`Обязательная спецификация "${template.display_name}" не указана`);
      }
    }

    // 2. Валидируем каждую переданную спецификацию
    const allSpecificationNames = new Set([
      ...Object.keys(specifications),
      ...templates.map(t => t.name),
    ]);

    // Создаем контекст для кросс-валидации
    const validationContext: Record<string, TypedSpecificationValue> = {};

    // Первый проход - базовая валидация
    for (const specName of allSpecificationNames) {
      const template = templateMap.get(specName);
      const value = specifications[specName];

      if (!template) {
        if (value !== undefined && value !== null && value !== '') {
          warnings.push(`Спецификация "${specName}" не найдена в темплейтах категории`);
        }
        continue;
      }

      // Пропускаем пустые необязательные поля
      if (!template.is_required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Валидируем значение
      const validationResult = SpecificationValidator.validateAndNormalize(
        value,
        template.validation_rules
      );

      validationDetails[specName] = validationResult;

      if (!validationResult.isValid) {
        errors.push(`${template.display_name}: ${validationResult.errors.join(', ')}`);
      } else {
        normalizedSpecifications[specName] = validationResult.normalizedValue;
        validationContext[specName] = validationResult.normalizedValue;
      }

      if (validationResult.warnings.length > 0) {
        warnings.push(`${template.display_name}: ${validationResult.warnings.join(', ')}`);
      }
    }

    // Второй проход - кросс-валидация для compatibility_key полей
    const compatibilityTemplates = templates.filter(t => t.is_compatibility_key);
    for (const template of compatibilityTemplates) {
      const value = specifications[template.name];

      if (value !== undefined && value !== null && value !== '') {
        const validationResult = SpecificationValidator.validateAndNormalize(
          value,
          template.validation_rules,
          validationContext
        );

        // Обновляем результат с учетом кросс-валидации
        validationDetails[template.name] = validationResult;

        if (!validationResult.isValid) {
          // Заменяем предыдущие ошибки на новые (с кросс-проверками)
          const existingErrorIndex = errors.findIndex(e =>
            e.startsWith(`${template.display_name}:`)
          );
          const newError = `${template.display_name}: ${validationResult.errors.join(', ')}`;

          if (existingErrorIndex >= 0) {
            errors[existingErrorIndex] = newError;
          } else {
            errors.push(newError);
          }
        }

        if (validationResult.warnings.length > 0) {
          warnings.push(`${template.display_name}: ${validationResult.warnings.join(', ')}`);
        }
      }
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      validationDetails,
      normalizedSpecifications,
    };
  }

  /**
   * 💾 СОЗДАНИЕ СПЕЦИФИКАЦИЙ ПРОДУКТА В БД
   */
  private static async createProductSpecifications(
    productId: string,
    normalizedSpecifications: Record<string, TypedSpecificationValue>,
    templates: CategorySpecificationTemplate[]
  ): Promise<{
    success: boolean;
    specificationsCreated?: number;
    errors?: string[];
  }> {
    try {
      const templateMap = new Map<string, CategorySpecificationTemplate>();
      templates.forEach(template => {
        templateMap.set(template.name, template);
      });

      const specInserts: Omit<ProductSpecification, 'id' | 'created_at' | 'updated_at'>[] = [];

      // Подготавливаем данные для вставки
      for (const [specName, normalizedValue] of Object.entries(normalizedSpecifications)) {
        const template = templateMap.get(specName);
        if (!template) continue;

        // Определяем основное значение для поля value
        let mainValue = '';
        if (normalizedValue.enumValue) {
          mainValue = normalizedValue.enumValue;
        } else if (normalizedValue.numberValue !== undefined) {
          mainValue = `${normalizedValue.numberValue}${normalizedValue.unit ? ' ' + normalizedValue.unit : ''}`;
        } else if (normalizedValue.booleanValue !== undefined) {
          mainValue = normalizedValue.booleanValue ? 'true' : 'false';
        } else if (normalizedValue.textValue) {
          mainValue = normalizedValue.textValue;
        }

        const specData: Omit<ProductSpecification, 'id' | 'created_at' | 'updated_at'> = {
          product_id: productId,
          template_id: template.id,
          name: template.name,
          value: mainValue,
          display_order: template.display_order || 0,

          // Типизированные значения
          value_enum: normalizedValue.enumValue || null,
          value_number: normalizedValue.numberValue || null,
          value_text: normalizedValue.textValue || null,
          value_boolean: normalizedValue.booleanValue || null,
        };

        specInserts.push(specData);
      }

      if (specInserts.length === 0) {
        return {
          success: true,
          specificationsCreated: 0,
        };
      }

      // Вставляем спецификации в БД
      const { error } = await supabase.from('product_specifications').insert(specInserts);

      if (error) {
        console.error('❌ Specifications creation failed:', error);
        return {
          success: false,
          errors: [`Ошибка создания спецификаций: ${error.message}`],
        };
      }

      console.log(`✅ Created ${specInserts.length} specifications`);

      return {
        success: true,
        specificationsCreated: specInserts.length,
      };
    } catch (error) {
      console.error('❌ Unexpected error in createProductSpecifications:', error);
      return {
        success: false,
        errors: [`Внутренняя ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * 🔄 ОБНОВЛЕНИЕ СПЕЦИФИКАЦИЙ ПРОДУКТА
   */
  static async updateProductSpecifications(
    productId: string,
    specifications: Record<string, any>
  ): Promise<{
    success: boolean;
    specificationsUpdated?: number;
    errors?: string[];
    warnings?: string[];
  }> {
    try {
      console.log(`🔄 Updating specifications for product: ${productId}`);

      // 1. Получаем продукт и его категорию
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('subcategory_id, category_id')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        return {
          success: false,
          errors: ['Продукт не найден'],
        };
      }

      const categoryId = product.subcategory_id || product.category_id;

      // 2. Получаем темплейты категории
      const templatesResult = await TemplateService.getTemplatesForCategory(categoryId);
      if (!templatesResult.success || !templatesResult.templates) {
        return {
          success: false,
          errors: templatesResult.errors || ['Не удалось получить темплейты категории'],
        };
      }

      // 3. Валидируем спецификации
      const validationResult = await this.validateProductSpecifications(
        specifications,
        templatesResult.templates
      );

      if (!validationResult.success) {
        return {
          success: false,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        };
      }

      // 4. Удаляем старые спецификации
      const { error: deleteError } = await supabase
        .from('product_specifications')
        .delete()
        .eq('product_id', productId);

      if (deleteError) {
        return {
          success: false,
          errors: [`Ошибка удаления старых спецификаций: ${deleteError.message}`],
        };
      }

      // 5. Создаем новые спецификации
      const createResult = await this.createProductSpecifications(
        productId,
        validationResult.normalizedSpecifications!,
        templatesResult.templates
      );

      if (!createResult.success) {
        return {
          success: false,
          errors: createResult.errors,
        };
      }

      return {
        success: true,
        specificationsUpdated: createResult.specificationsCreated,
        warnings: validationResult.warnings,
      };
    } catch (error) {
      console.error('❌ Unexpected error in updateProductSpecifications:', error);
      return {
        success: false,
        errors: [`Внутренняя ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * 📋 ПОЛУЧЕНИЕ СПЕЦИФИКАЦИЙ ПРОДУКТА С ТЕМПЛЕЙТАМИ
   */
  static async getProductSpecifications(productId: string): Promise<{
    success: boolean;
    specifications?: (ProductSpecification & { template?: CategorySpecificationTemplate })[];
    errors?: string[];
  }> {
    try {
      const { data: specifications, error } = await supabase
        .from('product_specifications')
        .select(
          `
          *,
          template:template_id (*)
        `
        )
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) {
        return {
          success: false,
          errors: [`Ошибка получения спецификаций: ${error.message}`],
        };
      }

      return {
        success: true,
        specifications: specifications || [],
      };
    } catch (error) {
      console.error('❌ Unexpected error in getProductSpecifications:', error);
      return {
        success: false,
        errors: [`Внутренняя ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * 🎯 ГОТОВЫЙ ПОМОЩНИК ДЛЯ СОЗДАНИЯ ПРОЦЕССОРА
   */
  static async createProcessor(
    basicInfo: {
      title: string;
      slug: string;
      description?: string;
      price: number;
      brand?: string;
      sku?: string;
      subcategory_id: string;
    },
    specs: {
      socket: string; // 'AM4', 'LGA1700', etc.
      base_frequency: number; // в MHz, например 3200
      boost_frequency?: number; // в MHz
      cores: number;
      threads: number;
      tdp: number; // в Watts
    }
  ) {
    const productData: Omit<Product, 'id' | 'created_at' | 'updated_at'> = {
      ...basicInfo,
      old_price: null,
      discount_percentage: null,
      main_image_url: null,
      category_id: null,
      rating: 0,
      review_count: 0,
      in_stock: true,
    };

    return this.createProductWithSpecifications(productData, specs);
  }

  /**
   * 🎯 ГОТОВЫЙ ПОМОЩНИК ДЛЯ СОЗДАНИЯ МАТЕРИНСКОЙ ПЛАТЫ
   */
  static async createMotherboard(
    basicInfo: {
      title: string;
      slug: string;
      description?: string;
      price: number;
      brand?: string;
      sku?: string;
      subcategory_id: string;
    },
    specs: {
      socket: string; // 'AM4', 'LGA1700', etc.
      chipset: string; // 'B550', 'Z690', etc.
      memory_type: string; // 'DDR4', 'DDR5'
      memory_slots: number; // 2, 4, etc.
      max_memory: number; // в GB
      form_factor: string; // 'ATX', 'Micro ATX', etc.
    }
  ) {
    const productData: Omit<Product, 'id' | 'created_at' | 'updated_at'> = {
      ...basicInfo,
      old_price: null,
      discount_percentage: null,
      main_image_url: null,
      category_id: null,
      rating: 0,
      review_count: 0,
      in_stock: true,
    };

    return this.createProductWithSpecifications(productData, specs);
  }
}
