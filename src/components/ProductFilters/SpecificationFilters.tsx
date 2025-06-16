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
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Загружаем доступные фильтры при изменении категории
  useEffect(() => {
    loadFilters();
  }, [categorySlug]);

  const loadFilters = async () => {
    setIsLoading(true);
    try {
      const availableFilters = await getAvailableFilters(categorySlug);
      setFilters(availableFilters);
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
    <div key={filter.templateId} className="mb-4">
      <h4 className="font-semibold text-sm text-gray-900 mb-2">
        {filter.templateName.charAt(0).toUpperCase() + filter.templateName.slice(1)}
      </h4>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {filter.values?.map(value => {
          const isSelected = selectedFilters[filter.templateName]?.includes(value);
          return (
            <label key={value} className="flex items-center cursor-pointer">
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
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-600">{value}</span>
            </label>
          );
        })}
      </div>
    </div>
  );

  const renderRangeFilter = (filter: SpecificationFilter) => (
    <div key={filter.templateId} className="mb-4">
      <h4 className="font-semibold text-sm text-gray-900 mb-2">
        {filter.templateName.charAt(0).toUpperCase() + filter.templateName.slice(1)}
      </h4>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="number"
            placeholder="От"
            min={filter.min}
            max={filter.max}
            value={selectedFilters[filter.templateName]?.min || ''}
            onChange={e => {
              const currentFilter = selectedFilters[filter.templateName] || {};
              handleFilterChange(filter.templateName, {
                ...currentFilter,
                min: e.target.value ? Number(e.target.value) : undefined,
              });
            }}
            className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-gray-500">—</span>
          <input
            type="number"
            placeholder="До"
            min={filter.min}
            max={filter.max}
            value={selectedFilters[filter.templateName]?.max || ''}
            onChange={e => {
              const currentFilter = selectedFilters[filter.templateName] || {};
              handleFilterChange(filter.templateName, {
                ...currentFilter,
                max: e.target.value ? Number(e.target.value) : undefined,
              });
            }}
            className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        {filter.min !== undefined && filter.max !== undefined && (
          <div className="text-xs text-gray-500">
            Диапазон: {filter.min} — {filter.max}
          </div>
        )}
      </div>
    </div>
  );

  const renderSelectFilter = (filter: SpecificationFilter) => (
    <div key={filter.templateId} className="mb-4">
      <h4 className="font-semibold text-sm text-gray-900 mb-2">
        {filter.templateName.charAt(0).toUpperCase() + filter.templateName.slice(1)}
      </h4>
      <select
        value={selectedFilters[filter.templateName] || ''}
        onChange={e => handleFilterChange(filter.templateName, e.target.value || null)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">Все</option>
        {filter.values?.map(value => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </div>
  );

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (filters.length === 0) {
    return null;
  }

  const hasActiveFilters = Object.keys(selectedFilters).length > 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Заголовок с кнопкой сворачивания */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Фильтры</h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="text-sm text-red-600 hover:text-red-700">
              Очистить
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 lg:hidden"
          >
            {isExpanded ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Контент фильтров */}
      <div className={`p-4 ${!isExpanded ? 'hidden lg:block' : ''}`}>
        {filters.map(filter => {
          switch (filter.filterType) {
            case 'checkbox':
              return renderCheckboxFilter(filter);
            case 'range':
              return renderRangeFilter(filter);
            case 'select':
            case 'radio':
              return renderSelectFilter(filter);
            default:
              return renderCheckboxFilter(filter);
          }
        })}

        {/* Показываем активные фильтры */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Активные фильтры:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(selectedFilters).map(([filterName, value]) => (
                <div
                  key={filterName}
                  className="flex items-center bg-primary/10 text-primary px-2 py-1 rounded text-xs"
                >
                  <span className="truncate max-w-24">
                    {filterName}:{' '}
                    {Array.isArray(value)
                      ? value.join(', ')
                      : typeof value === 'object'
                        ? `${value.min || 0}-${value.max || '∞'}`
                        : value}
                  </span>
                  <button
                    onClick={() => handleFilterChange(filterName, null)}
                    className="ml-1 text-primary hover:text-primary/80"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
