'use client';

import React from 'react';
import { Product, Category } from '@/lib/supabase/types/types';
import { EnhancedPCConfiguration, ValidationResult } from '@/lib/supabase/types/specifications';

interface ConfigurationSummaryProps {
  configuration: EnhancedPCConfiguration;
  products: Record<string, Product>;
  validationResult: ValidationResult;
  categories: Category[];
  getCategoryDisplayName: (category: Category) => string;
}

export default function ConfigurationSummary({
  configuration,
  products,
  validationResult,
  categories,
  getCategoryDisplayName,
}: ConfigurationSummaryProps) {
  const selectedComponents = Object.entries(configuration.components).filter(
    ([, componentId]) => componentId
  );

  const getCategoryNameBySlug = (slug: string): string => {
    const category = categories.find(c => c.slug === slug);
    return category ? getCategoryDisplayName(category) : slug;
  };

  if (selectedComponents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Configuration Summary</h3>
        <div className="text-center py-8 text-gray-500">
          Select components for your configuration
        </div>
      </div>
    );
  }

  const totalPrice = selectedComponents.reduce((sum, [, componentId]) => {
    if (typeof componentId === 'string' && products[componentId]) {
      return sum + products[componentId].price;
    } else if (Array.isArray(componentId)) {
      return (
        sum +
        componentId.reduce((subSum, id) => {
          return subSum + (products[id]?.price || 0);
        }, 0)
      );
    }
    return sum;
  }, 0);

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Configuration Summary</h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">${totalPrice.toFixed(2)}</div>
            <div className="text-sm text-gray-600">{selectedComponents.length} components</div>
          </div>
        </div>
      </div>

      {/* Component List */}
      <div className="p-6">
        <div className="space-y-4">
          {selectedComponents.map(([categorySlug, componentId]) => {
            // Processing single component
            if (typeof componentId === 'string') {
              const product = products[componentId];
              if (!product) return null;

              return (
                <div
                  key={categorySlug}
                  className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {getCategoryNameBySlug(categorySlug)}
                    </div>
                    <div className="text-sm text-gray-600">{product.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${product.price.toFixed(2)}</div>
                    {!product.in_stock && <div className="text-xs text-red-600">Out of stock</div>}
                  </div>
                </div>
              );
            }

            // Processing multiple components (memory, storage)
            if (Array.isArray(componentId)) {
              const componentProducts = componentId.map(id => products[id]).filter(Boolean);
              if (componentProducts.length === 0) return null;

              const totalCategoryPrice = componentProducts.reduce(
                (sum, product) => sum + product.price,
                0
              );

              return (
                <div key={categorySlug} className="py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-gray-900">
                      {getCategoryNameBySlug(categorySlug)} ({componentProducts.length})
                    </div>
                    <div className="font-medium">${totalCategoryPrice.toFixed(2)}</div>
                  </div>
                  <div className="space-y-1">
                    {componentProducts.map((product, index) => (
                      <div key={product.id} className="flex justify-between items-center text-sm">
                        <div className="text-gray-600">
                          {index + 1}. {product.title}
                        </div>
                        <div className="text-gray-700">${product.price.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Additional information */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            {/* Compatibility status */}
            <div className="text-center">
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  configuration.compatibilityStatus === 'valid'
                    ? 'bg-green-100 text-green-800'
                    : configuration.compatibilityStatus === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {configuration.compatibilityStatus === 'valid' && '✅ Compatible'}
                {configuration.compatibilityStatus === 'error' && '❌ Errors'}
                {configuration.compatibilityStatus === 'warning' && '⚠️ Warnings'}
              </div>
              <div className="text-gray-600 mt-1">Compatibility</div>
            </div>

            {/* Recommended PSU Power - only shown when GPU with recommended_psu_power is selected */}
            {configuration.recommendedPsuPower && configuration.recommendedPsuPower > 0 && (
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {configuration.recommendedPsuPower}W
                </div>
                <div className="text-gray-600">Recommended PSU</div>
              </div>
            )}

            {/* In stock quantity */}
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {
                  selectedComponents.filter(([, componentId]) => {
                    if (typeof componentId === 'string') {
                      return products[componentId]?.in_stock;
                    } else if (Array.isArray(componentId)) {
                      return componentId.every(id => products[id]?.in_stock);
                    }
                    return false;
                  }).length
                }
                /{selectedComponents.length}
              </div>
              <div className="text-gray-600">In Stock</div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex space-x-4">
            <button
              className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              disabled={validationResult.issues.length > 0}
            >
              {validationResult.issues.length > 0
                ? 'Fix compatibility errors'
                : 'Add to Cart'}
            </button>
            <button className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
