import React, { useState } from 'react';
import { CategoryFilterState, Filter } from '@/types/filters';
import { SearchFilterComponent } from './SearchFilterComponent';
import { PriceRangeFilterComponent } from './PriceRangeFilterComponent';
import { BrandFilterComponent } from './BrandFilterComponent';
import { AvailabilityFilterComponent } from './AvailabilityFilterComponent';
import { EnumFilterComponent } from './EnumFilterComponent';
import { NumberRangeFilterComponent } from './NumberRangeFilterComponent';
import { BooleanFilterComponent } from './BooleanFilterComponent';

type FilterValue = string | string[] | { min: number | null; max: number | null } | boolean | null | 'all' | 'in_stock' | 'out_of_stock';

interface FilterPanelProps {
  filterState: CategoryFilterState;
  onFilterChange: (filterId: string, value: FilterValue) => void;
  onClearAllFilters: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filterState,
  onFilterChange,
  onClearAllFilters,
}) => {
  const [showAllFilters, setShowAllFilters] = useState(false);
  const maxVisibleFilters = 10;
  const renderFilter = (filter: Filter) => {
    const commonProps = {
      filter,
      onChange: (value: FilterValue) => onFilterChange(filter.id, value),
    };

    switch (filter.type) {
      case 'search':
        return <SearchFilterComponent key={filter.id} {...commonProps} />;
      case 'price_range':
        return <PriceRangeFilterComponent key={filter.id} {...commonProps} />;
      case 'brand':
        return <BrandFilterComponent key={filter.id} {...commonProps} />;
      case 'availability':
        return <AvailabilityFilterComponent key={filter.id} {...commonProps} />;
      case 'enum':
        return <EnumFilterComponent key={filter.id} {...commonProps} />;
      case 'number_range':
        return <NumberRangeFilterComponent key={filter.id} {...commonProps} />;
      case 'boolean':
        return <BooleanFilterComponent key={filter.id} {...commonProps} />;
      default:
        return null;
    }
  };

  // Determine which filters to show
  const visibleFilters = showAllFilters 
    ? filterState.filters 
    : filterState.filters.slice(0, maxVisibleFilters);
  
  const hasMoreFilters = filterState.filters.length > maxVisibleFilters;

  return (
    <div className="mb-4">
      {/* Beautiful Filter Layout */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {visibleFilters.map(renderFilter)}
        
        {/* Show More/Less Filters Button */}
        {hasMoreFilters && (
          <button
            onClick={() => setShowAllFilters(!showAllFilters)}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-md transition-colors duration-200"
          >
            {showAllFilters 
              ? `Show fewer filters` 
              : `Show ${filterState.filters.length - maxVisibleFilters} more filters`
            }
          </button>
        )}
        
        {/* Clear All Button */}
        {filterState.activeFiltersCount > 0 && (
          <button
            onClick={onClearAllFilters}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-md transition-colors duration-200"
          >
            Clear all ({filterState.activeFiltersCount})
          </button>
        )}
      </div>
    </div>
  );
};