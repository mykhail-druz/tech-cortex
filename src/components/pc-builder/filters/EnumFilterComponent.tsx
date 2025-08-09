import React, { useState, useRef, useEffect } from 'react';
import { EnumFilter } from '@/types/filters';

interface EnumFilterComponentProps {
  filter: EnumFilter;
  onChange: (value: string[]) => void;
}

export const EnumFilterComponent: React.FC<EnumFilterComponentProps> = ({
  filter,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleOption = (optionValue: string) => {
    if (filter.multiSelect) {
      const newValue = filter.value.includes(optionValue)
        ? filter.value.filter(v => v !== optionValue)
        : [...filter.value, optionValue];
      
      onChange(newValue);
    } else {
      // Single select
      onChange(filter.value.includes(optionValue) ? [] : [optionValue]);
      setIsOpen(false);
    }
  };

  const handleSelectAll = () => {
    if (!filter.multiSelect) return;
    
    if (filter.value.length === filter.options.length) {
      // If all are selected, deselect all
      onChange([]);
    } else {
      // Select all
      onChange(filter.options.map(option => option.value));
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  const getSelectionText = () => {
    if (filter.value.length === 0) {
      return '';
    } else if (filter.value.length === 1) {
      const selectedOption = filter.options.find(opt => opt.value === filter.value[0]);
      return selectedOption?.label || filter.value[0];
    } else {
      return `${filter.value.length} selected`;
    }
  };

  const sortedOptions = [...filter.options].sort((a, b) => {
    // Sort by selection status first (selected items at top), then by label
    const aSelected = filter.value.includes(a.value);
    const bSelected = filter.value.includes(b.value);
    
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    
    return a.label.localeCompare(b.label);
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
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
          <span className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-64 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Header with actions */}
          {filter.multiSelect && (
            <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">
                  {filter.options.length} options
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {filter.value.length === filter.options.length ? 'Clear' : 'All'}
                  </button>
                  {filter.value.length > 0 && (
                    <button
                      onClick={handleClear}
                      className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Options list */}
          <div className="py-1">
            {sortedOptions.map((option) => {
              const isSelected = filter.value.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={`flex items-center px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                >
                  <input
                    type={filter.multiSelect ? 'checkbox' : 'radio'}
                    name={filter.multiSelect ? undefined : `enum-${filter.id}`}
                    checked={isSelected}
                    onChange={() => handleToggleOption(option.value)}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-2 flex-1 flex items-center justify-between">
                    <span className={isSelected ? 'text-blue-900 font-medium' : 'text-gray-900'}>
                      {option.label}
                    </span>
                    {option.count !== undefined && (
                      <span className="text-xs text-gray-500">
                        ({option.count})
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          {filter.options.length === 0 && (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
};