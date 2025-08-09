import React, { useState, useEffect } from 'react';
import { NumberRangeFilter } from '@/types/filters';

interface NumberRangeFilterComponentProps {
  filter: NumberRangeFilter;
  onChange: (value: { min: number | null; max: number | null }) => void;
}

export const NumberRangeFilterComponent: React.FC<NumberRangeFilterComponentProps> = ({
  filter,
  onChange,
}) => {
  const [tempMin, setTempMin] = useState<string>(filter.value.min?.toString() || '');
  const [tempMax, setTempMax] = useState<string>(filter.value.max?.toString() || '');
  const [isExpanded, setIsExpanded] = useState(false);

  // Update temp values when filter value changes
  useEffect(() => {
    setTempMin(filter.value.min?.toString() || '');
    setTempMax(filter.value.max?.toString() || '');
  }, [filter.value]);

  const formatValue = (value: number) => {
    if (filter.unit) {
      return `${value} ${filter.unit}`;
    }
    return value.toString();
  };

  const getSelectionText = () => {
    if (filter.value.min !== null && filter.value.max !== null) {
      return `${formatValue(filter.value.min)} - ${formatValue(filter.value.max)}`;
    } else if (filter.value.min !== null) {
      return `From ${formatValue(filter.value.min)}`;
    } else if (filter.value.max !== null) {
      return `Up to ${formatValue(filter.value.max)}`;
    }
    return '';
  };

  const handleApply = () => {
    const minValue = tempMin ? parseFloat(tempMin) : null;
    const maxValue = tempMax ? parseFloat(tempMax) : null;

    // Validate values
    if (minValue !== null && maxValue !== null && minValue > maxValue) {
      alert('Minimum value cannot be greater than maximum value');
      return;
    }

    if (minValue !== null && minValue < filter.range.min) {
      alert(`Minimum value cannot be less than ${filter.range.min}`);
      return;
    }

    if (maxValue !== null && maxValue > filter.range.max) {
      alert(`Maximum value cannot be greater than ${filter.range.max}`);
      return;
    }

    onChange({ min: minValue, max: maxValue });
  };

  const handleClear = () => {
    setTempMin('');
    setTempMax('');
    onChange({ min: null, max: null });
  };

  const handleQuickSelect = (min: number | null, max: number | null) => {
    onChange({ min, max });
    setIsExpanded(false);
  };

  // Generate quick select options based on range
  const generateQuickOptions = () => {
    const { min, max } = filter.range;
    const range = max - min;
    const step = Math.ceil(range / 4);

    return [
      { label: `Under ${formatValue(min + step)}`, min: null, max: min + step },
      {
        label: `${formatValue(min + step)} - ${formatValue(min + step * 2)}`,
        min: min + step,
        max: min + step * 2,
      },
      {
        label: `${formatValue(min + step * 2)} - ${formatValue(min + step * 3)}`,
        min: min + step * 2,
        max: min + step * 3,
      },
      { label: `Over ${formatValue(min + step * 3)}`, min: min + step * 3, max: null },
    ];
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={`${filter.displayName} filter`}
        className={`px-4 py-2 text-sm border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm ${
          filter.isActive
            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 shadow-md'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-md'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">{filter.displayName}</span>
          {getSelectionText() && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 truncate max-w-32">
              {getSelectionText()}
            </span>
          )}
          <span
            className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          >
            ▼
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="absolute top-full left-0 right-0 mt-1 p-4 border border-gray-200 rounded-md bg-white shadow-lg space-y-4 z-50 w-[275px]">
          {/* Quick select options */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Select</h4>
            <div className="grid grid-cols-1 gap-2">
              {generateQuickOptions().map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSelect(option.min, option.max)}
                  className="px-3 py-2 text-left text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom range inputs */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Custom Range</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Minimum {filter.unit && `(${filter.unit})`}
                </label>
                <input
                  type="number"
                  value={tempMin}
                  onChange={e => setTempMin(e.target.value)}
                  placeholder={filter.range.min.toString()}
                  min={filter.range.min}
                  max={filter.range.max}
                  step={filter.step}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Maximum {filter.unit && `(${filter.unit})`}
                </label>
                <input
                  type="number"
                  value={tempMax}
                  onChange={e => setTempMax(e.target.value)}
                  placeholder={filter.range.max.toString()}
                  min={filter.range.min}
                  max={filter.range.max}
                  step={filter.step}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Range: {formatValue(filter.range.min)} - {formatValue(filter.range.max)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Apply
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Clear
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
