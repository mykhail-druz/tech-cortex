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
import {
  getConfigurationForBuilder,
  getPublicConfigurationForBuilder,
} from '@/lib/supabase/services/configurationService';
import { getProductById } from '@/lib/supabase/db';
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
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isLoadingConfiguration, setIsLoadingConfiguration] = useState(false);

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

  // Cleanup validation timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  // Helper function to fetch and cache product data for component IDs
  const fetchAndCacheProducts = async (components: Record<string, string | string[]>) => {
    const productIds: string[] = [];

    // Collect all product IDs from components
    Object.values(components).forEach(componentId => {
      if (typeof componentId === 'string') {
        productIds.push(componentId);
      } else if (Array.isArray(componentId)) {
        productIds.push(...componentId);
      }
    });

    // Fetch product data for all IDs
    const productPromises = productIds.map(async id => {
      try {
        const result = await getProductById(id);
        if (result.data && !result.error) {
          return { id, product: result.data };
        }
        console.warn(`Failed to fetch product ${id}:`, result.error);
        return null;
      } catch (error) {
        console.error(`Error fetching product ${id}:`, error);
        return null;
      }
    });

    // Wait for all products to be fetched
    const productResults = await Promise.all(productPromises);

    // Update products cache with fetched data
    const newProductsCache: Record<string, Product> = {};
    productResults.forEach(result => {
      if (result && result.product) {
        newProductsCache[result.id] = result.product;
      }
    });

    if (Object.keys(newProductsCache).length > 0) {
      setProductsCache(prev => ({ ...prev, ...newProductsCache }));
      console.log(
        `Cached ${Object.keys(newProductsCache).length} products for loaded configuration`
      );
    }
  };

  // Check for configuration to load from localStorage on mount
  useEffect(() => {
    const loadConfigurationFromStorage = async () => {
      // Check for regular user configuration
      const configIdToLoad = localStorage.getItem('loadConfigurationId');
      // Check for public configuration
      const publicConfigIdToLoad = localStorage.getItem('loadPublicConfigurationId');

      if (configIdToLoad) {
        try {
          // Set loading flag to prevent validation from overwriting loaded PSU power
          setIsLoadingConfiguration(true);
          
          // Clear the localStorage item immediately to prevent re-loading
          localStorage.removeItem('loadConfigurationId');

          // Fetch the user's configuration data
          const result = await getConfigurationForBuilder(configIdToLoad);

          if (result.success && result.data) {
            // Load the configuration components into the state
            setConfiguration(prevConfig => ({
              ...prevConfig,
              components: result.data!.components,
              compatibilityStatus: result.data!.configuration.compatibility_status,
              powerConsumption: result.data!.configuration.power_consumption,
              recommendedPsuPower: result.data!.configuration.recommended_psu_power,
            }));

            // Fetch and cache product data for all components
            await fetchAndCacheProducts(result.data.components);

            console.log('User configuration loaded successfully:', result.data.configuration.name);
          } else {
            console.error('Failed to load user configuration:', result.error);
          }
        } catch (error) {
          console.error('Error loading user configuration:', error);
        } finally {
          // Clear loading flag after products are cached
          setIsLoadingConfiguration(false);
        }
      } else if (publicConfigIdToLoad) {
        try {
          // Set loading flag to prevent validation from overwriting loaded PSU power
          setIsLoadingConfiguration(true);
          
          // Clear the localStorage item immediately to prevent re-loading
          localStorage.removeItem('loadPublicConfigurationId');

          // Fetch the public configuration data
          const result = await getPublicConfigurationForBuilder(publicConfigIdToLoad);

          if (result.success && result.data) {
            // Load the configuration components into the state
            setConfiguration(prevConfig => ({
              ...prevConfig,
              components: result.data!.components,
              compatibilityStatus: result.data!.configuration.compatibility_status,
              powerConsumption: result.data!.configuration.power_consumption,
              recommendedPsuPower: result.data!.configuration.recommended_psu_power,
            }));

            // Fetch and cache product data for all components
            await fetchAndCacheProducts(result.data.components);

            console.log(
              'Public configuration loaded successfully:',
              result.data.configuration.name
            );
          } else {
            console.error('Failed to load public configuration:', result.error);
          }
        } catch (error) {
          console.error('Error loading public configuration:', error);
        } finally {
          // Clear loading flag after products are cached
          setIsLoadingConfiguration(false);
        }
      }
    };

    loadConfigurationFromStorage();
  }, []); // Run only on mount

  // Helper function to check if we have core components for meaningful validation
  const hasCoreComponents = () => {
    const components = configuration.components;
    const hasProcessorAndMotherboard = components['cpu'] && components['motherboard'];
    const hasProcessorWithOthers = components['cpu'] && Object.keys(components).length >= 2;
    const hasMotherboardWithOthers =
      components['motherboard'] && Object.keys(components).length >= 2;

    return hasProcessorAndMotherboard || hasProcessorWithOthers || hasMotherboardWithOthers;
  };

  // Helper function to determine if we should show compatibility issues
  const shouldShowCompatibilityIssues = () => {
    const componentCount = Object.keys(configuration.components).length;
    return componentCount >= 2 && hasCoreComponents();
  };

  // Helper function to map subcategory slugs to parent category slugs for compatibility checking
  const getParentCategorySlug = (categorySlug: string): string => {
    const category = pcCategories.find(cat => cat.slug === categorySlug);
    if (!category) return categorySlug;

    // If it's a subcategory, find its parent
    if (category.is_subcategory && category.parent_id) {
      const parentCategory = pcCategories.find(cat => cat.id === category.parent_id);
      if (parentCategory) {
        return parentCategory.slug;
      }
    }

    // Return original slug if not a subcategory or parent not found
    return categorySlug;
  };

  // Actual validation logic (without debouncing)
  const performValidation = async () => {
    const componentCount = Object.keys(configuration.components).length;

    // Always calculate power consumption and total price regardless of validation state
    const totalPrice = calculateTotalPrice();

    // Collect products for power calculation - map subcategories to parent categories
    const products: Record<string, Product> = {};
    Object.entries(configuration.components).forEach(([category, componentId]) => {
      const parentCategorySlug = getParentCategorySlug(category);
      if (typeof componentId === 'string' && productsCache[componentId]) {
        products[parentCategorySlug] = productsCache[componentId];
      } else if (Array.isArray(componentId) && componentId.length > 0) {
        if (productsCache[componentId[0]]) {
          products[parentCategorySlug] = productsCache[componentId[0]];
        }
      }
    });

    // Progressive validation: don't show errors for incomplete configurations
    if (componentCount === 0) {
      setValidationResult({ isValid: true, issues: [], warnings: [] });
      setConfiguration(prev => ({
        ...prev,
        compatibilityStatus: 'valid',
        totalPrice,
      }));
      return;
    }

    // For single component or insufficient components, show building state but still calculate power
    if (componentCount === 1 || !hasCoreComponents()) {
      // Calculate power consumption even for incomplete configurations
      let powerConsumption = 0;
      let recommendedPsuPower = undefined;

      try {
        const result = await SmartCompatibilityEngine.validateConfiguration(products);
        powerConsumption = result.actualPowerConsumption || result.powerConsumption || 0;
        // Only use PSU recommendation if GPU with recommended_psu_power is selected
        recommendedPsuPower =
          result.recommendedPsuPower > 0 ? result.recommendedPsuPower : undefined;
      } catch {
        // Fallback power calculation if smart engine fails
        powerConsumption = Object.values(products).reduce((total, product) => {
          // Basic power estimation based on category
          const categoryPower: Record<string, number> = {
            cpu: 65,
            gpu: 150,
            ram: 5,
            storage: 10,
            motherboard: 25,
            psu: 0,
            case: 0,
            cooling: 15,
          };

          const category = Object.keys(configuration.components).find(
            cat => configuration.components[cat] === product.id
          );
          return total + (categoryPower[category || ''] || 0);
        }, 0);
        // Don't calculate PSU recommendation in fallback - only when GPU specifies it
        // But preserve loaded PSU power when loading a configuration
        if (!isLoadingConfiguration) {
          recommendedPsuPower = undefined;
        }
      }

      setValidationResult({ isValid: true, issues: [], warnings: [] });
      setConfiguration(prev => ({
        ...prev,
        compatibilityStatus: 'valid',
        totalPrice,
        powerConsumption,
        actualPowerConsumption: powerConsumption,
        // Preserve original recommendedPsuPower from loaded configuration if SmartCompatibilityEngine can't calculate it
        // Also preserve it when loading a configuration to prevent overwriting loaded values
        recommendedPsuPower:
          recommendedPsuPower !== undefined ? recommendedPsuPower : prev.recommendedPsuPower,
      }));
      return;
    }

    try {
      // Collect products for compatibility check - map subcategories to parent categories
      const products: Record<string, Product> = {};

      Object.entries(configuration.components).forEach(([category, componentId]) => {
        const parentCategorySlug = getParentCategorySlug(category);
        if (typeof componentId === 'string' && productsCache[componentId]) {
          products[parentCategorySlug] = productsCache[componentId];
        } else if (Array.isArray(componentId) && componentId.length > 0) {
          if (productsCache[componentId[0]]) {
            products[parentCategorySlug] = productsCache[componentId[0]];
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
        // Preserve original recommendedPsuPower from loaded configuration if SmartCompatibilityEngine can't calculate it
        recommendedPsuPower:
          result.recommendedPsuPower !== undefined
            ? result.recommendedPsuPower
            : prev.recommendedPsuPower,
      }));
    } catch {
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
      // Validation completed
    }
  };

  // Debounced validation function
  const validateConfiguration = () => {
    // Clear any existing timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    // Set new timeout for delayed validation
    const timeout = setTimeout(() => {
      performValidation();
    }, 300); // 300ms delay

    setValidationTimeout(timeout);
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
    // Don't show compatibility issues for incomplete configurations
    if (!shouldShowCompatibilityIssues()) {
      return [];
    }

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
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Component categories list - increased width for better text display */}
        <div className="xl:col-span-3">
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

        {/* Component selector - adjusted width to accommodate wider Components section */}
        <div className="xl:col-span-6">
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
          <CompatibilityPanel
            validationResult={validationResult}
            componentCount={Object.keys(configuration.components).length}
            selectedComponents={safeSelectedComponents}
            recommendedPsuPower={configuration.recommendedPsuPower}
          />
        </div>
      </div>

      {/* Configuration summary */}
      <ConfigurationSummary
        configuration={configuration}
        products={productsCache}
        validationResult={validationResult}
        categories={pcCategories}
        getCategoryDisplayName={getCategoryDisplayName}
        clearConfiguration={clearConfiguration}
      />
    </div>
  );
}
