// components/ProductFilters/FilterCategoryGroup.tsx
import React, { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { StandardFilter } from '@/lib/supabase/types/types';
import { StandardFilterComponent } from '@/components/ProductFilter/StandardFilterComponent';
import { cn } from '@/lib/utils/utils';
import { STANDARD_FILTER_CONFIG } from '@/lib/config/standardFilterConfig';

interface FilterCategoryGroupProps {
  categoryId: string;
  categoryName: string;
  filters: StandardFilter[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (filterId: string, values: string[]) => void;
  alwaysExpanded?: boolean;
  productCounts?: Record<string, number>;
}

export const FilterCategoryGroup: React.FC<FilterCategoryGroupProps> = ({
  categoryId,
  categoryName,
  filters,
  selectedFilters,
  onFilterChange,
  alwaysExpanded = false,
  productCounts,
}) => {
  const [isExpanded, setIsExpanded] = useState(
    alwaysExpanded || categoryId === 'primary'
  );

  // Count active filters in this category
  const activeFilterCount = filters.reduce((count, filter) => {
    const values = selectedFilters[filter.id] || [];
    return count + (values.length > 0 ? 1 : 0);
  }, 0);

  // Check if this is the primary category
  const isPrimary = categoryId === 'primary';

  // Get the appropriate styling based on category
  const getCategoryStyle = () => {
    switch (categoryId) {
      case 'primary':
        return 'mb-6';
      default:
        return 'mb-4';
    }
  };

  if (filters.length === 0) {
    return null;
  }

  return (
    <div className={cn('filter-category', getCategoryStyle())}>
      {/* Category Header - only show for non-primary categories */}
      {!isPrimary && (
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => !alwaysExpanded && setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full py-2 text-left"
          >
            <h2 className="text-sm font-semibold text-gray-800">
              {categoryName}
              {activeFilterCount > 0 && (
                <span className="ml-2 text-xs font-normal text-primary">
                  ({activeFilterCount})
                </span>
              )}
            </h2>
            {!alwaysExpanded && (
              <ChevronDownIcon
                className={cn(
                  'h-5 w-5 text-gray-500 transition-transform',
                  isExpanded ? 'rotate-180' : ''
                )}
              />
            )}
          </button>
        </div>
      )}

      {/* Filters */}
      {isExpanded && (
        <div className={cn('space-y-1', isPrimary ? '' : 'ml-1')}>
          {filters.map((filter) => (
            <StandardFilterComponent
              key={filter.id}
              filter={filter}
              selectedValues={selectedFilters[filter.id] || []}
              onValuesChange={(values) => onFilterChange(filter.id, values)}
              productCount={productCounts?.[filter.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterCategoryGroup;