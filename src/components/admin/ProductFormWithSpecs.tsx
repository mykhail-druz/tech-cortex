'use client';

import React, { useState, useEffect } from 'react';
import { CategorySpecificationTemplate } from '@/lib/supabase/types/specifications';
import { getCategoryTemplates, createProductWithValidatedSpecs } from '@/lib/supabase/adminDb';

interface ProductFormWithSpecsProps {
  categoryId: string;
  onProductCreated?: (productId: string) => void;
}

export default function ProductFormWithSpecs({
  categoryId,
  onProductCreated,
}: ProductFormWithSpecsProps) {
  const [templates, setTemplates] = useState<CategorySpecificationTemplate[]>([]);
  const [specifications, setSpecifications] = useState<{ [key: string]: any }>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Базовые поля продукта
  const [productData, setProductData] = useState({
    title: '',
    slug: '',
    description: '',
    price: 0,
    brand: '',
    sku: '',
    in_stock: true,
    tax_code: 'txcd_99999999', // Default general tax code
  });

  useEffect(() => {
    loadTemplates();
  }, [categoryId]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await getCategoryTemplates(categoryId);
      if (error) {
        console.error('Error loading templates:', error);
      } else {
        setTemplates(data || []);
        // Инициализируем пустые значения для спецификаций
        const initialSpecs: { [key: string]: any } = {};
        data?.forEach(template => {
          initialSpecs[template.name] = template.data_type === 'boolean' ? false : '';
        });
        setSpecifications(initialSpecs);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleSpecificationChange = (templateName: string, value: any) => {
    setSpecifications(prev => ({
      ...prev,
      [templateName]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      const result = await createProductWithValidatedSpecs(
        {
          ...productData,
          category_id: categoryId,
        },
        specifications
      );

      if (result.validationErrors && result.validationErrors.length > 0) {
        setValidationErrors(result.validationErrors);
      } else if (result.data) {
        alert('✅ Продукт успешно создан!');
        onProductCreated?.(result.data.id);
        // Сброс формы
        setProductData({
          title: '',
          slug: '',
          description: '',
          price: 0,
          brand: '',
          sku: '',
          in_stock: true,
          tax_code: 'txcd_99999999', // Reset to default tax code
        });
        setSpecifications({});
      } else if (result.error) {
        setValidationErrors([result.error.message]);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      setValidationErrors(['Внутренняя ошибка сервера']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSpecificationInput = (template: CategorySpecificationTemplate) => {
    const value = specifications[template.name] || '';

    switch (template.data_type) {
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={e => handleSpecificationChange(template.name, Number(e.target.value))}
            className="w-full p-2 border rounded"
            step={template.units === 'GHz' ? '0.1' : '1'}
            min={template.min_value || undefined}
            max={template.max_value || undefined}
            required={template.is_required}
          />
        );

      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={e => handleSpecificationChange(template.name, e.target.checked)}
            className="w-4 h-4"
          />
        );

      case 'enum':
      case 'socket':
      case 'memory_type':
      case 'power_connector':
        return (
          <select
            value={value}
            onChange={e => handleSpecificationChange(template.name, e.target.value)}
            className="w-full p-2 border rounded"
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

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={e => handleSpecificationChange(template.name, e.target.value)}
            className="w-full p-2 border rounded"
            required={template.is_required}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Ошибки валидации */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <h4 className="font-medium text-red-800 mb-2">Ошибки валидации:</h4>
          <ul className="list-disc list-inside text-red-700">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Базовые поля продукта */}
      <div className="bg-gray-50 p-4 rounded">
        <h3 className="font-medium mb-4">Основная информация</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <input
              type="text"
              value={productData.title}
              onChange={e => setProductData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <input
              type="text"
              value={productData.slug}
              onChange={e => setProductData(prev => ({ ...prev, slug: e.target.value }))}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Цена *</label>
            <input
              type="number"
              value={productData.price}
              onChange={e => setProductData(prev => ({ ...prev, price: Number(e.target.value) }))}
              className="w-full p-2 border rounded"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Бренд *</label>
            <input
              type="text"
              value={productData.brand}
              onChange={e => setProductData(prev => ({ ...prev, brand: e.target.value }))}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SKU *</label>
            <input
              type="text"
              value={productData.sku}
              onChange={e => setProductData(prev => ({ ...prev, sku: e.target.value }))}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tax Code</label>
            <select
              value={productData.tax_code}
              onChange={e => setProductData(prev => ({ ...prev, tax_code: e.target.value }))}
              className="w-full p-2 border rounded"
            >
              <option value="txcd_99999999">General - 99999999</option>
              <option value="txcd_20030000">Digital Goods - 20030000</option>
              <option value="txcd_35010000">Electronics - 35010000</option>
              <option value="txcd_30070000">Computer Hardware - 30070000</option>
              <option value="txcd_31000000">Software - 31000000</option>
              <option value="txcd_81000000">Services - 81000000</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Stripe Tax code for product tax calculation
            </p>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Описание</label>
          <textarea
            value={productData.description}
            onChange={e => setProductData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full p-2 border rounded"
            rows={3}
          />
        </div>
      </div>

      {/* Спецификации */}
      {templates.length > 0 && (
        <div className="bg-blue-50 p-4 rounded">
          <h3 className="font-medium mb-4">Технические характеристики</h3>
          <div className="space-y-4">
            {templates.map(template => (
              <div key={template.id}>
                <label className="block text-sm font-medium mb-1">
                  {template.display_name}
                  {template.is_required && <span className="text-red-500"> *</span>}
                  {template.units && <span className="text-gray-500"> ({template.units})</span>}
                </label>
                {template.description && (
                  <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                )}
                {renderSpecificationInput(template)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Кнопка отправки */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Создание...' : 'Создать продукт'}
      </button>
    </form>
  );
}
