// components/ProductFilters/StandardFilterComponent.tsx
import React, { useState } from 'react';
import { ChevronDownIcon, CheckIcon, SlidersHorizontal } from 'lucide-react';
import { StandardFilter } from '@/lib/supabase/types/types';
import { cn } from '@/lib/utils/utils';

interface StandardFilterComponentProps {
  filter: StandardFilter;
  selectedValues: string[];
  onValuesChange: (values: string[]) => void;
  productCount?: number;
  categoryName?: string;
}

export const StandardFilterComponent: React.FC<StandardFilterComponentProps> = ({
  filter,
  selectedValues,
  onValuesChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(filter.defaultExpanded ?? true);
  const [showAll, setShowAll] = useState(false);
  const [rangeValues, setRangeValues] = useState<[number, number]>(() => {
    // Initialize from selected values or default range
    if (
      selectedValues.length === 2 &&
      !isNaN(Number(selectedValues[0])) &&
      !isNaN(Number(selectedValues[1]))
    ) {
      return [Number(selectedValues[0]), Number(selectedValues[1])];
    }
    return filter.range ? [filter.range.min, filter.range.max] : [0, 100];
  });

  // Determine if this is a primary filter that should have special styling
  const isPrimaryFilter = filter.category === 'primary';

  // Get visible options based on showAll state
  const visibleOptions = showAll
    ? filter.options
    : filter.options?.slice(0, filter.maxVisibleOptions || 6);

  // Handle checkbox change
  const handleCheckboxChange = (value: string) => {
    if (selectedValues.includes(value)) {
      onValuesChange(selectedValues.filter(v => v !== value));
    } else {
      onValuesChange([...selectedValues, value]);
    }
  };

  // Handle dropdown change
  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '') {
      onValuesChange([]);
    } else {
      onValuesChange([value]);
    }
  };

  // Handle range change
  const handleRangeChange = (newValues: [number, number]) => {
    setRangeValues(newValues);
  };

  // Apply range filter
  const applyRangeFilter = () => {
    onValuesChange([String(rangeValues[0]), String(rangeValues[1])]);
  };

  // Reset range filter
  const resetRangeFilter = () => {
    if (filter.range) {
      setRangeValues([filter.range.min, filter.range.max]);
      onValuesChange([]);
    }
  };

  // Render checkbox filter
  const renderCheckboxFilter = () => {
    if (!filter.options || filter.options.length === 0) {
      return <div className="text-sm text-gray-500">No options available</div>;
    }

    return (
      <div className="space-y-2">
        {visibleOptions &&
          visibleOptions.map(option => (
            <label
              key={option.value}
              className={cn(
                'flex items-center justify-between py-1 cursor-pointer group',
                selectedValues.includes(option.value)
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-gray-800'
              )}
            >
              <div className="flex items-center">
                <div
                  className={cn(
                    'w-4 h-4 mr-2 border rounded flex items-center justify-center transition-colors',
                    selectedValues.includes(option.value)
                      ? 'bg-primary border-primary'
                      : 'border-gray-300 group-hover:border-gray-400'
                  )}
                >
                  {selectedValues.includes(option.value) && (
                    <CheckIcon className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className="text-sm">{option.label}</span>
              </div>
              {filter.showCount && option.count !== undefined && (
                <span className="text-xs text-gray-400">({option.count})</span>
              )}
            </label>
          ))}

        {filter.options.length > (filter.maxVisibleOptions || 6) && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-primary hover:text-primary-dark mt-1 font-medium"
          >
            {showAll ? 'Show less' : `Show all (${filter.options.length})`}
          </button>
        )}
      </div>
    );
  };

  // Render dropdown filter
  const renderDropdownFilter = () => {
    if (!filter.options || filter.options.length === 0) {
      return <div className="text-sm text-gray-500">No options available</div>;
    }

    return (
      <div className="relative">
        <select
          value={selectedValues[0] || ''}
          onChange={handleDropdownChange}
          className="w-full py-2 pl-3 pr-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        >
          <option value="">All {filter.displayName}</option>
          {filter.options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label} {option.count !== undefined && `(${option.count})`}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    );
  };

  // Render range filter
  const renderRangeFilter = () => {
    if (!filter.range) {
      return <div className="text-sm text-gray-500">Range not available</div>;
    }

    const { min, max, step = 1 } = filter.range;
    const isActive = selectedValues.length === 2;

    return (
      <div className="space-y-4">
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            {filter.unit === '$' ? '$' : ''}
            {rangeValues[0]}
            {filter.unit !== '$' ? ` ${filter.unit}` : ''}
          </span>
          <span>
            {filter.unit === '$' ? '$' : ''}
            {rangeValues[1]}
            {filter.unit !== '$' ? ` ${filter.unit}` : ''}
          </span>
        </div>

        <div className="px-4 max-w-[80%] mx-auto">
          <div className="relative h-1 bg-gray-200 rounded-full">
            <div
              className="absolute h-1 bg-primary rounded-full"
              style={{
                left: `${((rangeValues[0] - min) / (max - min)) * 100}%`,
                right: `${100 - ((rangeValues[1] - min) / (max - min)) * 100}%`,
              }}
            />
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={rangeValues[0]}
              onChange={e => handleRangeChange([Number(e.target.value), rangeValues[1]])}
              className="absolute w-full h-1 opacity-0 cursor-pointer"
            />
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={rangeValues[1]}
              onChange={e => handleRangeChange([rangeValues[0], Number(e.target.value)])}
              className="absolute w-full h-1 opacity-0 cursor-pointer"
            />
            <div
              className="absolute w-4 h-4 -mt-1.5 bg-white border border-gray-300 rounded-full shadow cursor-pointer"
              style={{ left: `${((rangeValues[0] - min) / (max - min)) * 100}%` }}
            />
            <div
              className="absolute w-4 h-4 -mt-1.5 bg-white border border-gray-300 rounded-full shadow cursor-pointer"
              style={{ left: `${((rangeValues[1] - min) / (max - min)) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={applyRangeFilter}
            className={cn(
              'flex-1 py-1 text-xs rounded-md',
              isActive
                ? 'bg-primary text-white hover:bg-primary-dark'
                : 'bg-primary/90 text-white hover:bg-primary'
            )}
          >
            Apply
          </button>
          {isActive && (
            <button
              onClick={resetRangeFilter}
              className="flex-1 py-1 text-xs text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render color filter
  const renderColorFilter = () => {
    if (!filter.options || filter.options.length === 0) {
      return <div className="text-sm text-gray-500">No colors available</div>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {filter.options.map(option => {
          const isSelected = selectedValues.includes(option.value);
          const colorCode = option.color || '#ccc';

          return (
            <button
              key={option.value}
              onClick={() => handleCheckboxChange(option.value)}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center border-2',
                isSelected ? 'border-primary' : 'border-transparent hover:border-gray-300'
              )}
              title={option.label}
            >
              <span className="w-6 h-6 rounded-full" style={{ backgroundColor: colorCode }} />
              {isSelected && <CheckIcon className="absolute w-3 h-3 text-white drop-shadow-md" />}
            </button>
          );
        })}
      </div>
    );
  };

  // Render size filter
  const renderSizeFilter = () => {
    if (!filter.options || filter.options.length === 0) {
      return <div className="text-sm text-gray-500">No sizes available</div>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {filter.options.map(option => {
          const isSelected = selectedValues.includes(option.value);

          return (
            <button
              key={option.value}
              onClick={() => handleCheckboxChange(option.value)}
              className={cn(
                'min-w-[40px] h-8 px-2 text-sm rounded flex items-center justify-center',
                isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  };

  // Render filter content based on type
  const renderFilterContent = () => {
    switch (filter.type) {
      case 'checkbox':
        return renderCheckboxFilter();
      case 'dropdown':
        return renderDropdownFilter();
      case 'range':
        return renderRangeFilter();
      case 'color':
        return renderColorFilter();
      case 'size':
        return renderSizeFilter();
      default:
        return <div className="text-sm text-gray-500">Unsupported filter type</div>;
    }
  };

  // Get filter icon based on type
  const getFilterIcon = () => {
    switch (filter.type) {
      case 'range':
        return <SlidersHorizontal className="w-4 h-4 mr-2 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'border-b border-gray-200 py-4',
        isPrimaryFilter && 'bg-gray-50 px-3 -mx-3 rounded-md border-gray-100 shadow-sm'
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center">
          {getFilterIcon()}
          <h3
            className={cn(
              'text-sm font-medium',
              isPrimaryFilter ? 'text-gray-800' : 'text-gray-700'
            )}
          >
            {filter.displayName}
            {selectedValues.length > 0 && (
              <span className="ml-2 text-xs font-normal text-primary">
                ({selectedValues.length})
              </span>
            )}
          </h3>
        </div>
        {filter.collapsible && (
          <ChevronDownIcon
            className={cn(
              'h-5 w-5 text-gray-400 transition-transform',
              isExpanded ? 'rotate-180' : ''
            )}
          />
        )}
      </button>

      {isExpanded && <div className="mt-3 space-y-2">{renderFilterContent()}</div>}
    </div>
  );
};
