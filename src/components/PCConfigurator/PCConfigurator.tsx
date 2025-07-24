'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/lib/supabase/types/types';
import {
  EnhancedPCConfiguration,
  ValidationResult,
  CompatibilityIssue,
} from '@/lib/supabase/types/specifications';
import { SmartCompatibilityEngine } from '@/lib/compatibility/SmartCompatibilityEngine';
import { usePCCategories } from '@/hooks/usePCCategories';
import ComponentSelector from './ComponentSelector';
import CompatibilityPanel from './CompatibilityPanel';
import ConfigurationSummary from './ConfigurationSummary';

export default function PCConfigurator() {
  // Replace hardcoded values with hook
  const {
    categories: pcCategories,
    isLoading: categoriesLoading,
    getCategoryDisplayName,
  } = usePCCategories();

  // Configuration state
  const [configuration, setConfiguration] = useState<EnhancedPCConfiguration>({
    components: {},
    compatibilityStatus: 'valid',
  });

  // Validation state
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    issues: [],
    warnings: [],
  });

  // Interface state
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);

  // Product cache
  const [productsCache, setProductsCache] = useState<Record<string, Product>>({});

  // Set the first category as active on a load
  useEffect(() => {
    if (pcCategories.length > 0 && !activeCategory) {
      setActiveCategory(pcCategories[0].slug);
    }
  }, [pcCategories, activeCategory]);

  // Validate configuration on changes
  useEffect(() => {
    validateConfiguration();
  }, [configuration.components]);

  const validateConfiguration = async () => {
    if (Object.keys(configuration.components).length === 0) {
      setValidationResult({ isValid: true, issues: [], warnings: [] });
      return;
    }

    setIsValidating(true);
    try {
      // Collect products for compatibility check
      const products: Record<string, Product> = {};

      Object.entries(configuration.components).forEach(([category, componentId]) => {
        if (typeof componentId === 'string' && productsCache[componentId]) {
          products[category] = productsCache[componentId];
        } else if (Array.isArray(componentId) && componentId.length > 0) {
          if (productsCache[componentId[0]]) {
            products[category] = productsCache[componentId[0]];
          }
        }
      });

      // Check compatibility using SmartCompatibilityEngine
      const result = await SmartCompatibilityEngine.validateConfiguration(products);

      setValidationResult(result);

      // Determine overall configuration status
      let compatibilityStatus: 'valid' | 'warning' | 'error' = 'valid';
      if (result.issues.length > 0) {
        compatibilityStatus = 'error';
      } else if (result.warnings.length > 0) {
        compatibilityStatus = 'warning';
      }

      setConfiguration(prev => ({
        ...prev,
        compatibilityStatus,
        totalPrice: calculateTotalPrice(),
        powerConsumption: result.powerConsumption, // Keep for backward compatibility
        actualPowerConsumption: result.actualPowerConsumption,
        recommendedPsuPower: result.recommendedPsuPower,
      }));
    } catch (error) {
      console.error('Error validating configuration:', error);
      setValidationResult({
        isValid: false,
        issues: [
          {
            type: 'error',
            component1: 'System',
            component2: 'Validation',
            message: 'Error checking compatibility',
            details: 'An internal error occurred',
            severity: 'medium',
          },
        ],
        warnings: [],
      });
    } finally {
      setIsValidating(false);
    }
  };

  const calculateTotalPrice = (): number => {
    let total = 0;
    Object.values(configuration.components).forEach(componentId => {
      if (typeof componentId === 'string' && productsCache[componentId]) {
        total += productsCache[componentId].price;
      } else if (Array.isArray(componentId)) {
        componentId.forEach(id => {
          if (productsCache[id]) total += productsCache[id].price;
        });
      }
    });
    return total;
  };

  const handleComponentSelect = async (categorySlug: string, product: Product | null) => {
    // Add product to cache
    if (product) {
      setProductsCache(prev => ({ ...prev, [product.id]: product }));

      // Update configuration
      setConfiguration(prev => ({
        ...prev,
        components: {
          ...prev.components,
          [categorySlug]: product.id,
        },
      }));
    } else {
      // Remove component
      setConfiguration(prev => {
        const newComponents = { ...prev.components };
        delete newComponents[categorySlug];
        return { ...prev, components: newComponents };
      });
    }
  };

  const handleMultipleComponentSelect = (categorySlug: string, products: Product[]) => {
    // For components that can have multiple items (memory, storage)
    products.forEach(product => {
      setProductsCache(prev => ({ ...prev, [product.id]: product }));
    });

    setConfiguration(prev => ({
      ...prev,
      components: {
        ...prev.components,
        [categorySlug]: products.map(p => p.id),
      },
    }));
  };

  const getSelectedProduct = (categorySlug: string): Product | null => {
    const componentId = configuration.components[categorySlug];
    if (typeof componentId === 'string') {
      return productsCache[componentId] || null;
    }
    return null;
  };

  const getSelectedProducts = (categorySlug: string): Product[] => {
    const componentIds = configuration.components[categorySlug];
    if (Array.isArray(componentIds)) {
      return componentIds.map(id => productsCache[id]).filter(Boolean);
    }
    return [];
  };

  const getCategoryStatus = (categorySlug: string): 'empty' | 'selected' | 'incompatible' => {
    const hasComponent = configuration.components[categorySlug];
    if (!hasComponent) return 'empty';

    // Check for issues with this category
    const hasIssues = validationResult.issues.some(
      issue =>
        issue.component1?.toLowerCase().includes(categorySlug) ||
        issue.component2?.toLowerCase().includes(categorySlug)
    );

    return hasIssues ? 'incompatible' : 'selected';
  };

  const getCompatibilityIssuesForCategory = (categorySlug: string): CompatibilityIssue[] => {
    return validationResult.issues.filter(
      issue =>
        issue.component1?.toLowerCase().includes(categorySlug) ||
        issue.component2?.toLowerCase().includes(categorySlug)
    );
  };

  const clearConfiguration = () => {
    setConfiguration({
      components: {},
      compatibilityStatus: 'valid',
    });
    setValidationResult({ isValid: true, issues: [], warnings: [] });
    setProductsCache({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selected':
        return 'border-green-500 bg-green-50';
      case 'incompatible':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'selected':
        return '✅';
      case 'incompatible':
        return '❌';
      default:
        return '⚪';
    }
  };

  // Create safe version of selectedComponents for ComponentSelector
  const safeSelectedComponents: Record<string, string | string[]> = {};
  Object.entries(configuration.components).forEach(([key, value]) => {
    if (value !== undefined) {
      safeSelectedComponents[key] = value;
    }
  });

  // Loading state
  if (categoriesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with overall status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">PC Configuration</h2>
            <div className="flex items-center space-x-4">
              <div
                className={`px-3 py-1 rounded text-sm font-medium ${
                  configuration.compatibilityStatus === 'valid'
                    ? 'bg-green-100 text-green-800'
                    : configuration.compatibilityStatus === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {configuration.compatibilityStatus === 'valid'
                  ? '✅ Compatible Configuration'
                  : configuration.compatibilityStatus === 'error'
                    ? '❌ Compatibility Issues Found'
                    : '⚠️ Warnings Detected'}
              </div>
              {isValidating && (
                <div className="text-sm text-gray-500">🔍 Checking compatibility...</div>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {configuration.totalPrice ? `$${configuration.totalPrice.toFixed(2)}` : '$0.00'}
            </div>
            {configuration.powerConsumption && (
              <div className="space-y-1">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Power Consumption:</span>
                </div>
                <div className="text-sm text-gray-700">
                  <span className="inline-flex items-center">
                    ⚡ Total Consumption:{' '}
                    <span className="font-semibold ml-1">{configuration.powerConsumption}W</span>
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  <span className="inline-flex items-center">
                    🔌 Recommended PSU:{' '}
                    <span className="font-semibold ml-1">
                      {Math.ceil((configuration.powerConsumption * 1.25) / 50) * 50}W
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex space-x-4">
          <button
            onClick={clearConfiguration}
            className="px-4 py-2 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Component categories list - smallest */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Components</h3>
            </div>

            <div className="p-2">
              {pcCategories.map(category => {
                const status = getCategoryStatus(category.slug);
                const issues = getCompatibilityIssuesForCategory(category.slug);

                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.slug)}
                    className={`w-full p-3 mb-2 rounded-lg border-2 transition-colors text-left ${getStatusColor(
                      status
                    )} ${activeCategory === category.slug ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {category.icon_url ? (
                          <span className="w-6 h-6 mr-2 flex-shrink-0 relative">
                            <Image
                              src={category.icon_url}
                              alt=""
                              width={24}
                              height={24}
                              className="object-contain"
                              aria-hidden="true"
                            />
                          </span>
                        ) : (
                          <span className="text-lg">{category.pc_icon || '🔧'}</span>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {getCategoryDisplayName(category)}
                            {category.pc_required && <span className="text-red-500 ml-1">*</span>}
                          </div>
                          <div className="text-xs text-gray-500">
                            {category.is_subcategory &&
                              pcCategories.find(c => c.id === category.parent_id) && (
                                <span className="font-medium text-primary-600 mr-1">
                                  {pcCategories.find(c => c.id === category.parent_id)?.name} →
                                </span>
                              )}
                            {category.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {issues.length > 0 ? <span>❌</span> : <span>{getStatusIcon(status)}</span>}
                        {issues.length > 0 && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                            {issues.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Component selector - ~70% width */}
        <div className="xl:col-span-7">
          {activeCategory ? (
            <ComponentSelector
              categorySlug={activeCategory}
              selectedComponents={safeSelectedComponents}
              selectedProduct={getSelectedProduct(activeCategory)}
              selectedProducts={getSelectedProducts(activeCategory)}
              onComponentSelect={handleComponentSelect}
              onMultipleComponentSelect={handleMultipleComponentSelect}
              compatibilityIssues={getCompatibilityIssuesForCategory(activeCategory)}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center py-8 text-gray-500">Select a category from the list</div>
            </div>
          )}
        </div>

        {/* Compatibility panel - remaining space */}
        <div className="xl:col-span-3">
          <CompatibilityPanel validationResult={validationResult} />
        </div>
      </div>

      {/* Configuration summary */}
      <ConfigurationSummary
        configuration={configuration}
        products={productsCache}
        validationResult={validationResult}
        categories={pcCategories}
        getCategoryDisplayName={getCategoryDisplayName}
      />
    </div>
  );
}
