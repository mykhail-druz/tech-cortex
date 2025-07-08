'use client';

import React, { useState, useEffect } from 'react';
import { SpecificationFilter } from '@/lib/supabase/types/specifications';
import { getAvailableFilters } from '@/lib/supabase/db';


interface SpecificationFiltersProps {
  categorySlug: string;
  onFiltersChange: (filters: Record<string, any>) => void;
  className?: string;
}

export default function SpecificationFilters({
  categorySlug,
  onFiltersChange,
  className = '',
}: SpecificationFiltersProps) {
  const [filters, setFilters] = useState<SpecificationFilter[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize collapsed state for each filter
  const [collapsedFilters, setCollapsedFilters] = useState<Record<string, boolean>>({});

  // Загружаем доступные фильтры при изменении категории
  useEffect(() => {
    loadFilters();
  }, [categorySlug]);

  const loadFilters = async () => {
    setIsLoading(true);
    try {
      const availableFilters = await getAvailableFilters(categorySlug);
      setFilters(availableFilters);

      // Create mapping from template names to display names
      const nameMapping: Record<string, string> = {};
      availableFilters.forEach(filter => {
        nameMapping[filter.templateName] = filter.displayName || filter.templateName;
      });
      setDisplayNames(nameMapping);

      // Initialize collapsed state for all filters (true = collapsed)
      const initialCollapsedState: Record<string, boolean> = {};
      availableFilters.forEach(filter => {
        initialCollapsedState[filter.templateId] = true;
      });
      setCollapsedFilters(initialCollapsedState);

      setSelectedFilters({});
      onFiltersChange({});
    } catch (error) {
      console.error('Error loading filters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filterName: string, value: any) => {
    const newFilters = { ...selectedFilters };

    if (
      value === null ||
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    ) {
      delete newFilters[filterName];
    } else {
      newFilters[filterName] = value;
    }

    setSelectedFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
    onFiltersChange({});
  };

  const renderCheckboxFilter = (filter: SpecificationFilter) => (
    <div className="space-y-1">
      {filter.values?.map(value => {
        const isSelected = selectedFilters[filter.templateName]?.includes(value);
        // Placeholder for count - in a real implementation, this would come from the backend
        const count = 0; // This would be replaced with actual count data

        return (
          <label 
            key={value} 
            className={`flex items-center justify-between cursor-pointer py-1 transition-all duration-150 ${
              isSelected 
                ? 'text-primary' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={isSelected || false}
                onChange={e => {
                  const currentValues = selectedFilters[filter.templateName] || [];
                  if (e.target.checked) {
                    handleFilterChange(filter.templateName, [...currentValues, value]);
                  } else {
                    handleFilterChange(
                      filter.templateName,
                      currentValues.filter((v: any) => v !== value)
                    );
                  }
                }}
                className="h-4 w-4 text-primary focus:ring-primary/30 border-gray-300 rounded"
              />
              <span className={`ml-2 text-sm ${isSelected ? 'font-medium' : ''}`}>
                {value}
              </span>
            </div>
            {count > 0 && (
              <span className="text-xs text-gray-400">({count})</span>
            )}
          </label>
        );
      })}
    </div>
  );

  const renderRangeFilter = (filter: SpecificationFilter) => {
    // Get current min and max values from selected filters or use defaults
    const currentMin = selectedFilters[filter.templateName]?.min !== undefined 
      ? selectedFilters[filter.templateName]?.min 
      : filter.min;
    const currentMax = selectedFilters[filter.templateName]?.max !== undefined 
      ? selectedFilters[filter.templateName]?.max 
      : filter.max;

    // State for tracking dragging
    const [isDraggingMin, setIsDraggingMin] = useState(false);
    const [isDraggingMax, setIsDraggingMax] = useState(false);

    // Calculate percentage positions for slider handles
    const minPercent = ((currentMin - filter.min) / (filter.max - filter.min)) * 100;
    const maxPercent = ((currentMax - filter.min) / (filter.max - filter.min)) * 100;

    // Handle mouse/touch events for slider
    const handleSliderMouseDown = (event: React.MouseEvent | React.TouchEvent, isMin: boolean) => {
      event.preventDefault();
      if (isMin) {
        setIsDraggingMin(true);
      } else {
        setIsDraggingMax(true);
      }
    };

    // Handle slider track click
    const handleTrackClick = (event: React.MouseEvent) => {
      if (isDraggingMin || isDraggingMax) return;

      const trackRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const clickPosition = event.clientX - trackRect.left;
      const trackWidth = trackRect.width;
      const clickPercent = (clickPosition / trackWidth) * 100;

      // Calculate value based on click position
      const range = filter.max - filter.min;
      const value = filter.min + (range * clickPercent / 100);

      // Determine which handle to move based on proximity
      const distToMin = Math.abs(clickPercent - minPercent);
      const distToMax = Math.abs(clickPercent - maxPercent);

      const currentFilter = selectedFilters[filter.templateName] || {};

      if (distToMin <= distToMax) {
        // Move min handle
        handleFilterChange(filter.templateName, {
          ...currentFilter,
          min: Math.round(value),
        });
      } else {
        // Move max handle
        handleFilterChange(filter.templateName, {
          ...currentFilter,
          max: Math.round(value),
        });
      }
    };

    // Handle mouse/touch move during drag
    useEffect(() => {
      const handleMouseMove = (event: MouseEvent | TouchEvent) => {
        if (!isDraggingMin && !isDraggingMax) return;

        // Get the slider track element
        const sliderTrack = document.getElementById(`slider-track-${filter.templateId}`);
        if (!sliderTrack) return;

        const trackRect = sliderTrack.getBoundingClientRect();
        const trackWidth = trackRect.width;

        // Get mouse/touch position
        let clientX: number;
        if ('touches' in event) {
          clientX = event.touches[0].clientX;
        } else {
          clientX = event.clientX;
        }

        // Calculate position relative to track
        let position = clientX - trackRect.left;
        position = Math.max(0, Math.min(position, trackWidth));

        // Convert position to value
        const positionPercent = (position / trackWidth) * 100;
        const range = filter.max - filter.min;
        const value = Math.round(filter.min + (range * positionPercent / 100));

        // Update the appropriate handle
        const currentFilter = selectedFilters[filter.templateName] || {};

        if (isDraggingMin) {
          // Ensure min doesn't exceed max
          const newMin = Math.min(value, currentMax);
          handleFilterChange(filter.templateName, {
            ...currentFilter,
            min: newMin,
          });
        } else if (isDraggingMax) {
          // Ensure max doesn't go below min
          const newMax = Math.max(value, currentMin);
          handleFilterChange(filter.templateName, {
            ...currentFilter,
            max: newMax,
          });
        }
      };

      const handleMouseUp = () => {
        setIsDraggingMin(false);
        setIsDraggingMax(false);
      };

      // Add event listeners when dragging
      if (isDraggingMin || isDraggingMax) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('touchmove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchend', handleMouseUp);
      }

      // Clean up event listeners
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('touchmove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchend', handleMouseUp);
      };
    }, [isDraggingMin, isDraggingMax, currentMin, currentMax, filter.min, filter.max, filter.templateName, filter.templateId]);

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="number"
              placeholder="Min"
              min={filter.min}
              max={filter.max}
              value={selectedFilters[filter.templateName]?.min || ''}
              onChange={e => {
                const currentFilter = selectedFilters[filter.templateName] || {};
                const newValue = e.target.value ? Number(e.target.value) : undefined;

                // Ensure min doesn't exceed max
                if (newValue !== undefined && currentFilter.max !== undefined && newValue > currentFilter.max) {
                  return;
                }

                handleFilterChange(filter.templateName, {
                  ...currentFilter,
                  min: newValue,
                });
              }}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/70 transition-all duration-200"
            />
          </div>
          <span className="text-gray-400 font-light text-sm">to</span>
          <div className="relative flex-1">
            <input
              type="number"
              placeholder="Max"
              min={filter.min}
              max={filter.max}
              value={selectedFilters[filter.templateName]?.max || ''}
              onChange={e => {
                const currentFilter = selectedFilters[filter.templateName] || {};
                const newValue = e.target.value ? Number(e.target.value) : undefined;

                // Ensure max doesn't go below min
                if (newValue !== undefined && currentFilter.min !== undefined && newValue < currentFilter.min) {
                  return;
                }

                handleFilterChange(filter.templateName, {
                  ...currentFilter,
                  max: newValue,
                });
              }}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/70 transition-all duration-200"
            />
          </div>
        </div>

        {filter.min !== undefined && filter.max !== undefined && (
          <div className="flex flex-col space-y-1 px-1 mt-4">
            <div 
              id={`slider-track-${filter.templateId}`}
              className="relative h-2 bg-gray-200 rounded-full cursor-pointer mt-6"
              onClick={handleTrackClick}
            >
              {/* Active range bar */}
              <div 
                className="absolute h-full bg-primary/70 rounded-full"
                style={{
                  left: `${minPercent}%`,
                  right: `${100 - maxPercent}%`
                }}
              ></div>

              {/* Min handle */}
              <div 
                className={`absolute w-5 h-5 bg-white border-2 border-primary rounded-full -mt-1.5 -ml-2.5 cursor-grab shadow-md transition-transform ${isDraggingMin ? 'cursor-grabbing scale-110' : ''}`}
                style={{ left: `${minPercent}%` }}
                onMouseDown={(e) => handleSliderMouseDown(e, true)}
                onTouchStart={(e) => handleSliderMouseDown(e, true)}
                role="slider"
                aria-valuemin={filter.min}
                aria-valuemax={filter.max}
                aria-valuenow={currentMin}
                aria-label="Minimum value"
                tabIndex={0}
              ></div>

              {/* Max handle */}
              <div 
                className={`absolute w-5 h-5 bg-white border-2 border-primary rounded-full -mt-1.5 -ml-2.5 cursor-grab shadow-md transition-transform ${isDraggingMax ? 'cursor-grabbing scale-110' : ''}`}
                style={{ left: `${maxPercent}%` }}
                onMouseDown={(e) => handleSliderMouseDown(e, false)}
                onTouchStart={(e) => handleSliderMouseDown(e, false)}
                role="slider"
                aria-valuemin={filter.min}
                aria-valuemax={filter.max}
                aria-valuenow={currentMax}
                aria-label="Maximum value"
                tabIndex={0}
              ></div>
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-2 px-0.5">
              <span>{filter.min}</span>
              <span>{filter.max}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSelectFilter = (filter: SpecificationFilter) => (
    <div className="relative">
      <select
        value={selectedFilters[filter.templateName] || ''}
        onChange={e => handleFilterChange(filter.templateName, e.target.value || null)}
        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/70 transition-all duration-200 pr-8 bg-white"
      >
        <option value="">All options</option>
        {filter.values?.map(value => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="mb-3">
          <div className="animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
        <div>
          <div className="animate-pulse">
            {/* Filter headers */}
            {[1, 2, 3].map(i => (
              <div key={i} className="mb-3">
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100 mb-1.5">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                </div>
                <div className="space-y-2">
                  {/* Filter items */}
                  {[1, 2].map(j => (
                    <div key={j} className="flex items-center py-1">
                      <div className="h-4 w-4 bg-gray-200 rounded mr-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (filters.length === 0) {
    return null;
  }

  const hasActiveFilters = Object.keys(selectedFilters).length > 0;

  // Toggle filter collapse
  const toggleFilter = (filterId: string) => {
    setCollapsedFilters(prev => ({
      ...prev,
      [filterId]: !prev[filterId]
    }));
  };

  return (
    <div className={`${className}`}>
      {/* Заголовок с кнопкой сворачивания */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Specifications</h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button 
              onClick={clearAllFilters} 
              className="text-sm text-red-600 hover:text-red-700 transition-colors duration-200"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 lg:hidden transition-colors duration-200"
          >
            {isExpanded ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Контент фильтров */}
      <div className={`${!isExpanded ? 'hidden lg:block' : ''}`}>
        <div>
          {/* Individual filters */}
          {filters.map(filter => (
            <div key={filter.templateId} className="mb-3">
              <div 
                className="flex items-center justify-between cursor-pointer py-1.5 border-b border-gray-100 mb-1.5 transition-colors duration-150"
                onClick={() => toggleFilter(filter.templateId)}
              >
                <h3 className="font-medium text-gray-700">
                  {filter.displayName || filter.templateName.charAt(0).toUpperCase() + filter.templateName.slice(1)}
                </h3>
                <span className="text-gray-400 transition-transform duration-200" style={{
                  transform: collapsedFilters[filter.templateId] ? 'rotate(0deg)' : 'rotate(180deg)'
                }}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 9l-7 7-7-7" 
                    />
                  </svg>
                </span>
              </div>

              <div className={`transition-all duration-300 ${
                collapsedFilters[filter.templateId] ? 'h-0 overflow-hidden opacity-0 m-0' : 'mt-1 opacity-100'
              }`}>
                <div>
                  {filter.filterType === 'checkbox' && renderCheckboxFilter(filter)}
                  {filter.filterType === 'range' && renderRangeFilter(filter)}
                  {(filter.filterType === 'select' || filter.filterType === 'radio') && renderSelectFilter(filter)}
                  {!filter.filterType && renderCheckboxFilter(filter)}
                </div>
              </div>
            </div>
          ))}

          {/* Active filters section */}
          {hasActiveFilters && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(selectedFilters).map(([filterName, value]) => (
                  <div
                    key={filterName}
                    className="flex items-center border border-gray-200 text-gray-700 px-2 py-1 rounded text-xs"
                    title={`Filter: ${displayNames[filterName] || filterName}`}
                  >
                    <span className="truncate max-w-32">
                      {Array.isArray(value)
                        ? value.join(', ')
                        : typeof value === 'object'
                          ? `${value.min || 0}-${value.max || '∞'}`
                          : value}
                    </span>
                    <button
                      onClick={() => handleFilterChange(filterName, null)}
                      className="ml-1.5 text-gray-400 hover:text-gray-700 transition-colors duration-200 w-4 h-4 flex items-center justify-center"
                      aria-label={`Remove ${displayNames[filterName] || filterName} filter`}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {Object.keys(selectedFilters).length > 1 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all duration-200 px-2 py-1 rounded"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
