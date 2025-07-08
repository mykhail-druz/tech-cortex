// components/ProductFilters/StandardizedFilterContainer.tsx
import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, Filter } from 'lucide-react';
import { StandardFilter } from '@/lib/supabase/types/types';
import { FilterCategoryGroup } from './FilterCategoryGroup';
import { STANDARD_FILTER_CONFIG } from '@/lib/config/standardFilterConfig';
import { cn } from '@/lib/utils/utils';

interface StandardizedFilterContainerProps {
  filters: StandardFilter[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (filterId: string, values: string[]) => void;
  onClearAllFilters: () => void;
  productCounts?: Record<string, number>;
  categoryName?: string;
  isLoading?: boolean;
}

export const StandardizedFilterContainer: React.FC<StandardizedFilterContainerProps> = ({
  filters,
  selectedFilters,
  onFilterChange,
  onClearAllFilters,
  productCounts,
  categoryName,
  isLoading = false,
}) => {
  // Group filters by category
  const [groupedFilters, setGroupedFilters] = useState<Record<string, StandardFilter[]>>({});
  
  // Count active filters
  const activeFilterCount = Object.values(selectedFilters).reduce(
    (count, values) => count + (values.length > 0 ? 1 : 0),
    0
  );

  // Group filters by category when filters change
  useEffect(() => {
    const grouped: Record<string, StandardFilter[]> = {};
    
    // Initialize categories
    Object.values(STANDARD_FILTER_CONFIG.CATEGORIES).forEach(category => {
      grouped[category.id] = [];
    });
    
    // Group filters
    filters.forEach(filter => {
      const category = filter.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(filter);
    });
    
    // Sort filters within each category by priority
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => a.priority - b.priority);
    });
    
    setGroupedFilters(grouped);
  }, [filters]);

  // Get category display name
  const getCategoryDisplayName = (categoryId: string): string => {
    const categories = STANDARD_FILTER_CONFIG.CATEGORIES;
    
    switch(categoryId) {
      case 'primary': return categories.PRIMARY.displayName;
      case 'technical': return categories.TECHNICAL.displayName;
      case 'physical': return categories.PHYSICAL.displayName;
      case 'compatibility': return categories.COMPATIBILITY.displayName;
      case 'other': return categories.OTHER.displayName;
      default: return 'Other Filters';
    }
  };

  // Get active filters for display
  const getActiveFilters = (): { filterId: string; filterName: string; values: string[] }[] => {
    return Object.entries(selectedFilters)
      .filter(([_, values]) => values.length > 0)
      .map(([filterId, values]) => {
        const filter = filters.find(f => f.id === filterId);
        return {
          filterId,
          filterName: filter?.displayName || filterId,
          values,
        };
      });
  };

  // Render active filter badges
  const renderActiveFilters = () => {
    const activeFilters = getActiveFilters();
    
    if (activeFilters.length === 0) {
      return null;
    }
    
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Active Filters</h3>
          <button
            onClick={onClearAllFilters}
            className="text-xs text-primary hover:text-primary-dark font-medium"
          >
            Clear All
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeFilters.map(({ filterId, filterName, values }) => (
            <div
              key={filterId}
              className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-700"
            >
              <span className="font-medium mr-1">{filterName}:</span>
              <span className="truncate max-w-[100px]">
                {values.length === 1
                  ? values[0]
                  : values.length === 2 && filterId === 'price'
                  ? `$${values[0]} - $${values[1]}`
                  : `${values.length} selected`}
              </span>
              <button
                onClick={() => onFilterChange(filterId, [])}
                className="ml-1 text-gray-500 hover:text-gray-700"
                aria-label={`Remove ${filterName} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  // No filters state
  if (filters.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Filter className="w-12 h-12 mx-auto text-gray-300 mb-2" />
        <p>No filters available for this category</p>
      </div>
    );
  }

  return (
    <div className="filters-container">
      {/* Filter header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <SlidersHorizontal className="w-5 h-5 mr-2 text-gray-500" />
          <h2 className="text-lg font-medium text-gray-800">
            Filters
            {categoryName && <span className="ml-1 text-gray-500">for {categoryName}</span>}
          </h2>
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={onClearAllFilters}
            className="text-sm text-primary hover:text-primary-dark font-medium flex items-center"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </button>
        )}
      </div>

      {/* Active filters */}
      {renderActiveFilters()}

      {/* Filter groups by category */}
      <div className="space-y-2">
        {Object.entries(groupedFilters)
          // Sort by category priority
          .sort(([a], [b]) => {
            const priorityA = STANDARD_FILTER_CONFIG.CATEGORIES[a.toUpperCase()]?.priority || 1000;
            const priorityB = STANDARD_FILTER_CONFIG.CATEGORIES[b.toUpperCase()]?.priority || 1000;
            return priorityA - priorityB;
          })
          // Only show categories with filters
          .filter(([_, categoryFilters]) => categoryFilters.length > 0)
          .map(([categoryId, categoryFilters]) => (
            <FilterCategoryGroup
              key={categoryId}
              categoryId={categoryId}
              categoryName={getCategoryDisplayName(categoryId)}
              filters={categoryFilters}
              selectedFilters={selectedFilters}
              onFilterChange={onFilterChange}
              alwaysExpanded={categoryId === 'primary' || STANDARD_FILTER_CONFIG.CATEGORIES[categoryId.toUpperCase()]?.alwaysExpanded}
              productCounts={productCounts}
            />
          ))}
      </div>
    </div>
  );
};

export default StandardizedFilterContainer;