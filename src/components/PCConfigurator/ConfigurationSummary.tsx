'use client';

import React, { useState } from 'react';
import { Product, Category } from '@/lib/supabase/types/types';
import { EnhancedPCConfiguration, ValidationResult } from '@/lib/supabase/types/specifications';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AddToCartModal from './AddToCartModal';
import SaveConfigurationModal from './SaveConfigurationModal';
import { FaCheckCircle, FaRegTimesCircle, FaExclamationTriangle } from 'react-icons/fa';

interface ConfigurationSummaryProps {
  configuration: EnhancedPCConfiguration;
  products: Record<string, Product>;
  validationResult: ValidationResult;
  categories: Category[];
  getCategoryDisplayName: (category: Category) => string;
  clearConfiguration: () => void;
}

export default function ConfigurationSummary({
  configuration,
  products,
  validationResult,
  categories,
  getCategoryDisplayName,
  clearConfiguration,
}: ConfigurationSummaryProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isAddToCartModalOpen, setIsAddToCartModalOpen] = useState(false);
  const [isSaveConfigModalOpen, setIsSaveConfigModalOpen] = useState(false);
  const [isClearConfirmModalOpen, setIsClearConfirmModalOpen] = useState(false);

  const selectedComponents = Object.entries(configuration.components).filter(
    ([, componentId]) => componentId
  );

  const getCategoryNameBySlug = (slug: string): string => {
    const category = categories.find(c => c.slug === slug);
    return category ? getCategoryDisplayName(category) : slug;
  };

  const handleAddToCart = () => {
    if (validationResult.issues.length > 0) {
      return; // Don't add to cart if there are compatibility issues
    }
    setIsAddToCartModalOpen(true);
  };

  const handleSaveConfiguration = () => {
    // Check if user is logged in
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Check if there are components to save
    if (selectedComponents.length === 0) {
      return;
    }

    setIsSaveConfigModalOpen(true);
  };

  const handleClearConfiguration = () => {
    setIsClearConfirmModalOpen(true);
  };

  const handleConfirmClear = () => {
    clearConfiguration();
    setIsClearConfirmModalOpen(false);
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
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
                  className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 items-start md:items-center py-3 border-b border-gray-100 last:border-b-0"
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
                <div
                  key={categorySlug}
                  className="flex flex-col md:flex-row py-3 border-b border-gray-100 last:border-b-0"
                >
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                {configuration.compatibilityStatus === 'valid' && (
                  <>
                    <FaCheckCircle className="w-3 h-3 mr-1" />
                    Compatible
                  </>
                )}
                {configuration.compatibilityStatus === 'error' && (
                  <>
                    <FaRegTimesCircle className="w-3 h-3 mr-1" />
                    Errors
                  </>
                )}
                {configuration.compatibilityStatus === 'warning' && (
                  <>
                    <FaExclamationTriangle className="w-3 h-3 mr-1" />
                    Warnings
                  </>
                )}
              </div>
              <div className="text-gray-600 mt-2">Compatibility</div>
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
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-0 md:space-x-4 justify-end ">
            <button
              onClick={handleAddToCart}
              className="flex-1 md:max-w-[225px] bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={validationResult.issues.length > 0}
            >
              {validationResult.issues.length > 0 ? 'Fix compatibility errors' : 'Add to Cart'}
            </button>
            <div className="flex space-x-4">
              <button
                onClick={handleSaveConfiguration}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedComponents.length === 0}
              >
                Save Configuration
              </button>
              <button
                onClick={handleClearConfiguration}
                className="px-6 py-3 border  bg-red-500 rounded-lg font-medium text-white hover:bg-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedComponents.length === 0}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddToCartModal
        isOpen={isAddToCartModalOpen}
        onClose={() => setIsAddToCartModalOpen(false)}
        selectedComponents={selectedComponents}
        products={products}
        getCategoryNameBySlug={getCategoryNameBySlug}
        totalPrice={totalPrice}
      />

      <SaveConfigurationModal
        isOpen={isSaveConfigModalOpen}
        onClose={() => setIsSaveConfigModalOpen(false)}
        configuration={configuration}
        selectedComponents={selectedComponents}
        products={products}
        totalPrice={totalPrice}
      />

      {/* Clear Configuration Confirmation Modal */}
      {isClearConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Clear Configuration</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to clear all selected components? This action cannot be undone.
            </p>
            <div className="flex space-x-4 justify-end">
              <button
                onClick={() => setIsClearConfirmModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
