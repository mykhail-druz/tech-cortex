'use client';

import React, { useState, useEffect } from 'react';
import { SimpleSpecificationService } from '@/lib/specifications/SimpleSpecificationService';
import { SpecificationTemplate } from '@/lib/specifications/types';
import { SimpleSpecificationValidator } from '@/lib/supabase/types/specifications';
import Spinner from '@/components/ui/Spinner';

interface SimpleProductSpecificationFormProps {
  categoryId: string;
  productId?: string;
  onSpecificationsChange: (specifications: Array<{name: string; value: string; display_order: number}>) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export default function SimpleProductSpecificationForm({
  categoryId,
  productId,
  onSpecificationsChange,
  onValidationChange
}: SimpleProductSpecificationFormProps) {
  const [templates, setTemplates] = useState<SpecificationTemplate[]>([]);
  const [specifications, setSpecifications] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isValid, setIsValid] = useState(true);

  // Загрузка темплейтов при изменении категории
  useEffect(() => {
    loadTemplates();
  }, [categoryId]);

  // Загрузка существующих спецификаций при изменении продукта
  useEffect(() => {
    if (productId) {
      loadProductSpecifications();
    }
  }, [productId]);

  // Валидация при изменении спецификаций
  useEffect(() => {
    validateSpecifications();
  }, [specifications, templates]);

  const loadTemplates = async () => {
    if (!categoryId) return;

    setLoading(true);
    try {
      const result = await SimpleSpecificationService.getTemplatesForCategory(categoryId);
      if (result.success && result.data) {
        setTemplates(result.data);
        
        // Инициализируем пустые значения
        const initialSpecs: Record<string, string> = {};
        result.data.forEach(template => {
          initialSpecs[template.name] = '';
        });
        setSpecifications(initialSpecs);
      } else {
        console.error('Failed to load templates:', result.errors);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductSpecifications = async () => {
    if (!productId) return;

    try {
      const result = await SimpleSpecificationService.getProductSpecifications(productId);
      if (result.success && result.data) {
        const existingSpecs: Record<string, string> = {};
        result.data.forEach(spec => {
          existingSpecs[spec.name] = spec.value;
        });
        setSpecifications(prev => ({ ...prev, ...existingSpecs }));
      }
    } catch (error) {
      console.error('Error loading product specifications:', error);
    }
  };

  const validateSpecifications = () => {
    const errors: Record<string, string[]> = {};
    let hasErrors = false;

    templates.forEach(template => {
      const value = specifications[template.name] || '';
      const validation = SimpleSpecificationValidator.validateValue(
        value,
        template.data_type,
        template.is_required,
        template.enum_values
      );

      if (!validation.isValid) {
        errors[template.name] = validation.errors;
        hasErrors = true;
      }
    });

    setValidationErrors(errors);
    setIsValid(!hasErrors);
    onValidationChange?.(isValid);
  };

  const handleSpecificationChange = (templateName: string, value: string) => {
    const newSpecifications = {
      ...specifications,
      [templateName]: value
    };
    
    setSpecifications(newSpecifications);

    // Преобразуем в формат для родительского компонента
    const formattedSpecs = templates.map(template => ({
      name: template.name,
      value: newSpecifications[template.name] || '',
      display_order: template.display_order
    }));

    onSpecificationsChange(formattedSpecs);
  };

  const renderSpecificationInput = (template: SpecificationTemplate) => {
    const value = specifications[template.name] || '';
    const hasError = validationErrors[template.name]?.length > 0;

    const inputClassName = `w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${
      hasError ? 'border-red-500' : 'border-gray-300'
    }`;

    switch (template.data_type) {
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={e => handleSpecificationChange(template.name, e.target.value)}
            className={inputClassName}
            placeholder={template.placeholder || `Введите ${template.display_name.toLowerCase()}`}
            required={template.is_required}
            step="any"
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={['true', '1', 'да'].includes(value.toLowerCase())}
              onChange={e => handleSpecificationChange(template.name, e.target.checked ? 'true' : 'false')}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">
              {template.help_text || 'Отметьте, если применимо'}
            </span>
          </div>
        );

      case 'enum':
        return (
          <select
            value={value}
            onChange={e => handleSpecificationChange(template.name, e.target.value)}
            className={inputClassName}
            required={template.is_required}
          >
            <option value="">Выберите {template.display_name.toLowerCase()}</option>
            {template.enum_values?.map(enumValue => (
              <option key={enumValue} value={enumValue}>
                {enumValue}
              </option>
            ))}
          </select>
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={e => handleSpecificationChange(template.name, e.target.value)}
            className={inputClassName}
            placeholder={template.placeholder || `Введите ${template.display_name.toLowerCase()}`}
            required={template.is_required}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded p-4">
        <div className="flex items-center">
          <Spinner size="small" />
          <span className="ml-2 text-gray-600">Загрузка спецификаций...</span>
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Нет темплейтов спецификаций
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Для этой категории не настроены темплейты спецификаций. 
                Перейдите в раздел управления темплейтами, чтобы создать их.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Группируем спецификации на обязательные и опциональные
  const requiredTemplates = templates.filter(t => t.is_required);
  const optionalTemplates = templates.filter(t => !t.is_required);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium text-gray-900">Спецификации товара</h3>
        <p className="mt-1 text-sm text-gray-600">
          Заполните характеристики товара. Поля отмеченные * обязательны для заполнения.
        </p>
      </div>

      {/* Индикатор валидации */}
      {!isValid && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Исправьте ошибки в спецификациях
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Некоторые поля содержат ошибки. Проверьте выделенные поля ниже.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Обязательные спецификации */}
      {requiredTemplates.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Обязательные характеристики</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requiredTemplates.map(template => (
              <div key={template.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {template.display_name}
                  <span className="text-red-500 ml-1">*</span>
                  {template.unit && (
                    <span className="text-gray-500 ml-1">({template.unit})</span>
                  )}
                </label>
                {renderSpecificationInput(template)}
                {validationErrors[template.name] && (
                  <div className="text-sm text-red-600">
                    {validationErrors[template.name].map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                )}
                {template.help_text && (
                  <p className="text-xs text-gray-500">{template.help_text}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Опциональные спецификации */}
      {optionalTemplates.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Дополнительные характеристики</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optionalTemplates.map(template => (
              <div key={template.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {template.display_name}
                  {template.unit && (
                    <span className="text-gray-500 ml-1">({template.unit})</span>
                  )}
                </label>
                {renderSpecificationInput(template)}
                {validationErrors[template.name] && (
                  <div className="text-sm text-red-600">
                    {validationErrors[template.name].map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                )}
                {template.help_text && (
                  <p className="text-xs text-gray-500">{template.help_text}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}