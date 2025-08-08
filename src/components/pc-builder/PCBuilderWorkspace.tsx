import React, { useState, useMemo } from 'react';
import {
  PCBuilderProduct,
  PCBuilderWorkspaceState,
  ConfigurationSummaryData,
  CategoryBlockState,
} from '@/types/pc-builder';
import { PC_BUILDER_CATEGORIES, MOCK_PRODUCTS } from '@/data/pc-builder-mock-data';
import { CategoryBlock } from './CategoryBlock';
import { ConfigurationSummary } from './ConfigurationSummary';
import { FilterService } from '@/lib/filters/FilterService';

export const PCBuilderWorkspace: React.FC = () => {
  // Initialize workspace state
  const [workspaceState, setWorkspaceState] = useState<PCBuilderWorkspaceState>(() => {
    const initialCategories: Record<string, CategoryBlockState> = {};

    PC_BUILDER_CATEGORIES.forEach(category => {
      const availableProducts = MOCK_PRODUCTS[category.slug] || [];
      initialCategories[category.slug] = {
        isExpanded: false,
        selectedProduct: null,
        availableProducts,
        isLoading: false,
        filterState: FilterService.createInitialFilterState(category.slug, availableProducts),
      };
    });

    return {
      categories: initialCategories,
      configuration: {
        components: {},
        totalPrice: 0,
        estimatedPowerConsumption: 0,
        compatibilityStatus: 'valid',
        compatibilityIssues: [],
      },
      isLoading: false,
      error: null,
    };
  });

  // Calculate configuration summary data
  const configurationSummaryData: ConfigurationSummaryData = useMemo(() => {
    const selectedComponents = Object.values(workspaceState.configuration.components);

    // Simple power consumption estimation (this would be more complex in real implementation)
    const estimatedPowerConsumption = selectedComponents.reduce((total, component) => {
      const powerEstimates: Record<string, number> = {
        cpu: 125,
        gpu: 200,
        ram: 10,
        motherboard: 50,
        ssd: 5,
        hdd: 10,
        psu: 0, // PSU doesn't consume, it provides
        case: 0,
      };
      return total + (powerEstimates[component.categorySlug] || 0);
    }, 0);

    // Determine compatibility status (simplified - no required components)
    const compatibilityStatus: 'valid' | 'warning' | 'error' = 'valid';
    // Future compatibility checks can be added here

    return {
      totalComponents: selectedComponents.length,
      totalPrice: workspaceState.configuration.totalPrice,
      estimatedPowerConsumption,
      compatibilityStatus,
      missingCategories: [], // No required components anymore
      selectedComponents,
    };
  }, [workspaceState.configuration]);

  // Handle category expansion toggle
  const handleToggleExpand = (categorySlug: string) => {
    setWorkspaceState(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categorySlug]: {
          ...prev.categories[categorySlug],
          isExpanded: !prev.categories[categorySlug].isExpanded,
        },
      },
    }));
  };

  // Handle product selection
  const handleSelectProduct = (categorySlug: string, product: PCBuilderProduct) => {
    setWorkspaceState(prev => {
      const newComponents = { ...prev.configuration.components };

      // Add or update the selected component
      newComponents[categorySlug] = {
        categorySlug,
        product,
        quantity: 1,
      };

      // Calculate new total price
      const newTotalPrice = Object.values(newComponents).reduce(
        (total, component) => total + component.product.price * component.quantity,
        0
      );

      return {
        ...prev,
        categories: {
          ...prev.categories,
          [categorySlug]: {
            ...prev.categories[categorySlug],
            selectedProduct: product,
            isExpanded: false, // Collapse after selection
          },
        },
        configuration: {
          ...prev.configuration,
          components: newComponents,
          totalPrice: newTotalPrice,
        },
      };
    });
  };

  // Handle product removal
  const handleRemoveProduct = (categorySlug: string) => {
    setWorkspaceState(prev => {
      const newComponents = { ...prev.configuration.components };
      delete newComponents[categorySlug];

      // Calculate new total price
      const newTotalPrice = Object.values(newComponents).reduce(
        (total, component) => total + component.product.price * component.quantity,
        0
      );

      return {
        ...prev,
        categories: {
          ...prev.categories,
          [categorySlug]: {
            ...prev.categories[categorySlug],
            selectedProduct: null,
          },
        },
        configuration: {
          ...prev.configuration,
          components: newComponents,
          totalPrice: newTotalPrice,
        },
      };
    });
  };

  // Handle clearing all configuration
  const handleClearConfiguration = () => {
    setWorkspaceState(prev => {
      const clearedCategories = { ...prev.categories };
      Object.keys(clearedCategories).forEach(categorySlug => {
        clearedCategories[categorySlug] = {
          ...clearedCategories[categorySlug],
          selectedProduct: null,
          isExpanded: false,
        };
      });

      return {
        ...prev,
        categories: clearedCategories,
        configuration: {
          components: {},
          totalPrice: 0,
          estimatedPowerConsumption: 0,
          compatibilityStatus: 'valid',
          compatibilityIssues: [],
        },
      };
    });
  };

  // Handle filter changes
  const handleFilterChange = (categorySlug: string, filterId: string, value: string | string[] | { min: number | null; max: number | null } | boolean | null | 'all' | 'in_stock' | 'out_of_stock') => {
    setWorkspaceState(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categorySlug]: {
          ...prev.categories[categorySlug],
          filterState: FilterService.updateFilter(
            prev.categories[categorySlug].filterState,
            filterId,
            value
          ),
        },
      },
    }));
  };

  // Handle clearing all filters for a category
  const handleClearAllFilters = (categorySlug: string) => {
    setWorkspaceState(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categorySlug]: {
          ...prev.categories[categorySlug],
          filterState: FilterService.clearAllFilters(
            prev.categories[categorySlug].filterState
          ),
        },
      },
    }));
  };


  // Handle saving configuration (placeholder)
  const handleSaveConfiguration = () => {
    // This would integrate with the actual configuration service
    console.log('Saving configuration:', workspaceState.configuration);
    alert('Configuration saved! (In a real application, this would be saved to the database)');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Component Selection Area */}
      <div className="lg:col-span-4 space-y-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Component Selection</h2>
          <p className="text-gray-600">
            Choose components for your custom PC build. Test compatibility and build your ideal
            system.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Category Blocks */}
          <div className="lg:col-span-3 space-y-4">
            {PC_BUILDER_CATEGORIES.map(category => {
              const categoryState = workspaceState.categories[category.slug];
              const selectedComponent =
                workspaceState.configuration.components[category.slug] || null;

              return (
                <CategoryBlock
                  key={category.slug}
                  category={category}
                  availableProducts={categoryState.availableProducts}
                  selectedComponent={selectedComponent}
                  isExpanded={categoryState.isExpanded}
                  isLoading={categoryState.isLoading}
                  filterState={categoryState.filterState}
                  onToggleExpand={handleToggleExpand}
                  onSelectProduct={handleSelectProduct}
                  onRemoveProduct={handleRemoveProduct}
                  onFilterChange={handleFilterChange}
                  onClearAllFilters={handleClearAllFilters}
                />
              );
            })}
          </div>

          {/* Configuration Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <ConfigurationSummary
                data={configurationSummaryData}
                onRemoveComponent={handleRemoveProduct}
                onSaveConfiguration={handleSaveConfiguration}
                onClearConfiguration={handleClearConfiguration}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
