import { supabase } from '@/lib/supabaseClient';
import {
  CategorySpecificationTemplate,
  SpecificationDataType,
  SpecificationValidationRule,
  SpecificationValidator,
  SpecificationValidationResult,
  SPECIFICATION_ENUMS,
} from '@/lib/supabase/types/specifications';

/**
 * 🎯 СЕРВИС УПРАВЛЕНИЯ ТЕМПЛЕЙТАМИ СПЕЦИФИКАЦИЙ
 * Создание, валидация и управление темплейтами
 */
export class TemplateService {
  /**
   * ✅ СОЗДАНИЕ НОВОГО ТЕМПЛЕЙТА С ВАЛИДАЦИЕЙ
   */
  static async createTemplate(templateData: Omit<CategorySpecificationTemplate, 'id'>): Promise<{
    success: boolean;
    templateId?: string;
    errors?: string[];
    warnings?: string[];
  }> {
    try {
      console.log(
        `🏗️ Creating template: ${templateData.name} for category ${templateData.category_id}`
      );

      // 1. Валидируем данные темплейта
      const validation = this.validateTemplateData(templateData);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings,
        };
      }

      // 2. Проверяем уникальность имени в рамках категории
      const { data: existingTemplate } = await supabase
        .from('category_specification_templates')
        .select('id')
        .eq('category_id', templateData.category_id)
        .eq('name', templateData.name)
        .single();

      if (existingTemplate) {
        return {
          success: false,
          errors: [`Темплейт с именем "${templateData.name}" уже существует в этой категории`],
        };
      }

      // 3. Создаем темплейт
      const { data: template, error } = await supabase
        .from('category_specification_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) {
        console.error('❌ Template creation failed:', error);
        return {
          success: false,
          errors: [`Ошибка создания темплейта: ${error.message}`],
        };
      }

      console.log(`✅ Template created with ID: ${template.id}`);

      return {
        success: true,
        templateId: template.id,
        warnings: validation.warnings,
      };
    } catch (error) {
      console.error('❌ Unexpected error in createTemplate:', error);
      return {
        success: false,
        errors: [`Внутренняя ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * 🔍 ВАЛИДАЦИЯ ДАННЫХ ТЕМПЛЕЙТА
   */
  private static validateTemplateData(templateData: Omit<CategorySpecificationTemplate, 'id'>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Базовые проверки
    if (!templateData.name || templateData.name.trim().length === 0) {
      errors.push('Имя темплейта обязательно');
    }

    if (!templateData.display_name || templateData.display_name.trim().length === 0) {
      errors.push('Отображаемое имя темплейта обязательно');
    }

    if (!templateData.category_id) {
      errors.push('ID категории обязателен');
    }

    // Валидация имени (только латиница, цифры, подчеркивания)
    if (templateData.name && !/^[a-zA-Z0-9_]+$/.test(templateData.name)) {
      errors.push('Имя темплейта может содержать только латинские буквы, цифры и подчеркивания');
    }

    // Валидация enum_values для enum типов
    if (templateData.data_type === SpecificationDataType.ENUM) {
      if (!templateData.enum_values || templateData.enum_values.length === 0) {
        errors.push('Для enum типа обязательно указать возможные значения');
      }
    }

    // Валидация enum_source
    if (templateData.enum_source) {
      if (!(templateData.enum_source in SPECIFICATION_ENUMS)) {
        errors.push(`Неизвестный источник enum: ${templateData.enum_source}`);
      }
    }

    // Валидация validation_rules
    if (!templateData.validation_rules) {
      errors.push('Правила валидации обязательны');
    } else {
      const rulesValidation = this.validateValidationRules(
        templateData.validation_rules,
        templateData.data_type
      );
      errors.push(...rulesValidation.errors);
      warnings.push(...rulesValidation.warnings);
    }

    // Валидация filter_type для фильтруемых полей
    if (templateData.is_filterable && !templateData.filter_type) {
      warnings.push('Для фильтруемого поля рекомендуется указать тип фильтра');
    }

    // Валидация display_order
    if (templateData.display_order !== undefined && templateData.display_order < 0) {
      warnings.push('Порядок отображения не может быть отрицательным');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 🔍 ВАЛИДАЦИЯ ПРАВИЛ ВАЛИДАЦИИ
   */
  private static validateValidationRules(
    rules: SpecificationValidationRule,
    dataType: SpecificationDataType
  ): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Проверка соответствия dataType
    if (rules.dataType !== dataType) {
      errors.push(
        `Тип данных в правилах валидации (${rules.dataType}) не соответствует типу темплейта (${dataType})`
      );
    }

    // Валидация для числовых типов
    if (
      dataType === SpecificationDataType.NUMBER ||
      dataType === SpecificationDataType.FREQUENCY ||
      dataType === SpecificationDataType.MEMORY_SIZE ||
      dataType === SpecificationDataType.POWER_CONSUMPTION
    ) {
      if (rules.minValue !== undefined && rules.maxValue !== undefined) {
        if (rules.minValue >= rules.maxValue) {
          errors.push('Минимальное значение должно быть меньше максимального');
        }
      }

      if (rules.minValue !== undefined && rules.minValue < 0) {
        warnings.push('Отрицательное минимальное значение может быть неожиданным');
      }
    }

    // Валидация для enum типов
    if (dataType === SpecificationDataType.ENUM) {
      if (!rules.enumValues || rules.enumValues.length === 0) {
        errors.push('Для enum типа обязательно указать возможные значения в правилах');
      }
    }

    // Валидация паттерна
    if (rules.pattern) {
      try {
        new RegExp(rules.pattern);
      } catch (e) {
        errors.push(`Некорректное регулярное выражение в pattern: ${rules.pattern}`);
      }
    }

    return { errors, warnings };
  }

  /**
   * 📝 ОБНОВЛЕНИЕ ТЕМПЛЕЙТА
   */
  static async updateTemplate(
    templateId: string,
    updates: Partial<Omit<CategorySpecificationTemplate, 'id' | 'category_id'>>
  ): Promise<{
    success: boolean;
    errors?: string[];
    warnings?: string[];
  }> {
    try {
      console.log(`🔄 Updating template: ${templateId}`);

      // 1. Получаем текущий темплейт
      const { data: currentTemplate, error: fetchError } = await supabase
        .from('category_specification_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (fetchError || !currentTemplate) {
        return {
          success: false,
          errors: ['Темплейт не найден'],
        };
      }

      // 2. Создаем обновленную версию для валидации
      const updatedTemplate = { ...currentTemplate, ...updates };
      delete updatedTemplate.id; // Убираем id для валидации

      // 3. Валидируем обновленные данные
      const validation = this.validateTemplateData(updatedTemplate);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings,
        };
      }

      // 4. Проверяем уникальность имени (если имя изменилось)
      if (updates.name && updates.name !== currentTemplate.name) {
        const { data: existingTemplate } = await supabase
          .from('category_specification_templates')
          .select('id')
          .eq('category_id', currentTemplate.category_id)
          .eq('name', updates.name)
          .neq('id', templateId)
          .single();

        if (existingTemplate) {
          return {
            success: false,
            errors: [`Темплейт с именем "${updates.name}" уже существует в этой категории`],
          };
        }
      }

      // 5. Обновляем темплейт
      const { error: updateError } = await supabase
        .from('category_specification_templates')
        .update(updates)
        .eq('id', templateId);

      if (updateError) {
        console.error('❌ Template update failed:', updateError);
        return {
          success: false,
          errors: [`Ошибка обновления темплейта: ${updateError.message}`],
        };
      }

      console.log(`✅ Template updated: ${templateId}`);

      return {
        success: true,
        warnings: validation.warnings,
      };
    } catch (error) {
      console.error('❌ Unexpected error in updateTemplate:', error);
      return {
        success: false,
        errors: [`Внутренняя ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * 🗑️ УДАЛЕНИЕ ТЕМПЛЕЙТА
   */
  static async deleteTemplate(templateId: string): Promise<{
    success: boolean;
    errors?: string[];
    productsAffected?: number;
  }> {
    try {
      console.log(`🗑️ Deleting template: ${templateId}`);

      // 1. Проверяем, есть ли продукты с этим темплейтом
      const { data: productSpecs, error: specsError } = await supabase
        .from('product_specifications')
        .select('id')
        .eq('template_id', templateId);

      if (specsError) {
        return {
          success: false,
          errors: [`Ошибка проверки связанных продуктов: ${specsError.message}`],
        };
      }

      const productsAffected = productSpecs?.length || 0;

      if (productsAffected > 0) {
        return {
          success: false,
          errors: [
            `Нельзя удалить темплейт: он используется в ${productsAffected} спецификациях продуктов. ` +
              `Сначала удалите или измените связанные спецификации.`,
          ],
          productsAffected,
        };
      }

      // 2. Удаляем темплейт
      const { error: deleteError } = await supabase
        .from('category_specification_templates')
        .delete()
        .eq('id', templateId);

      if (deleteError) {
        console.error('❌ Template deletion failed:', deleteError);
        return {
          success: false,
          errors: [`Ошибка удаления темплейта: ${deleteError.message}`],
        };
      }

      console.log(`✅ Template deleted: ${templateId}`);

      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error in deleteTemplate:', error);
      return {
        success: false,
        errors: [`Внутренняя ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * 📋 ПОЛУЧЕНИЕ ТЕМПЛЕЙТОВ КАТЕГОРИИ
   */
  static async getTemplatesForCategory(categoryId: string): Promise<{
    success: boolean;
    templates?: CategorySpecificationTemplate[];
    errors?: string[];
  }> {
    try {
      const { data: templates, error } = await supabase
        .from('category_specification_templates')
        .select('*')
        .eq('category_id', categoryId)
        .order('display_order', { ascending: true });

      if (error) {
        return {
          success: false,
          errors: [`Ошибка получения темплейтов: ${error.message}`],
        };
      }

      return {
        success: true,
        templates: templates || [],
      };
    } catch (error) {
      console.error('❌ Unexpected error in getTemplatesForCategory:', error);
      return {
        success: false,
        errors: [`Внутренняя ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * 🔍 ВАЛИДАЦИЯ ЗНАЧЕНИЯ ПО ТЕМПЛЕЙТУ
   */
  static validateSpecificationValue(
    template: CategorySpecificationTemplate,
    value: any,
    context?: Record<string, any>
  ): SpecificationValidationResult {
    return SpecificationValidator.validateAndNormalize(value, template.validation_rules, context);
  }

  /**
   * 📊 СТАТИСТИКА ИСПОЛЬЗОВАНИЯ ТЕМПЛЕЙТА
   */
  static async getTemplateUsageStats(templateId: string): Promise<{
    success: boolean;
    stats?: {
      totalProducts: number;
      uniqueValues: number;
      mostCommonValue?: string;
      lastUsed?: string;
    };
    errors?: string[];
  }> {
    try {
      // Получаем все спецификации для этого темплейта
      const { data: specs, error } = await supabase
        .from('product_specifications')
        .select('value, value_enum, value_text, value_number, created_at')
        .eq('template_id', templateId);

      if (error) {
        return {
          success: false,
          errors: [`Ошибка получения статистики: ${error.message}`],
        };
      }

      if (!specs || specs.length === 0) {
        return {
          success: true,
          stats: {
            totalProducts: 0,
            uniqueValues: 0,
          },
        };
      }

      // Анализируем значения
      const values = new Map<string, number>();
      let lastUsed = '';

      specs.forEach(spec => {
        const value =
          spec.value_enum || spec.value_text || spec.value_number?.toString() || spec.value;
        if (value) {
          values.set(value, (values.get(value) || 0) + 1);
        }

        if (spec.created_at > lastUsed) {
          lastUsed = spec.created_at;
        }
      });

      // Находим самое популярное значение
      let mostCommonValue = '';
      let maxCount = 0;
      for (const [value, count] of values.entries()) {
        if (count > maxCount) {
          maxCount = count;
          mostCommonValue = value;
        }
      }

      return {
        success: true,
        stats: {
          totalProducts: specs.length,
          uniqueValues: values.size,
          mostCommonValue: mostCommonValue || undefined,
          lastUsed: lastUsed || undefined,
        },
      };
    } catch (error) {
      console.error('❌ Unexpected error in getTemplateUsageStats:', error);
      return {
        success: false,
        errors: [`Внутренняя ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }
}
