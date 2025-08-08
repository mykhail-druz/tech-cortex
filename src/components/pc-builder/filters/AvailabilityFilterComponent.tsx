import React from 'react';
import { AvailabilityFilter } from '@/types/filters';

interface AvailabilityFilterComponentProps {
  filter: AvailabilityFilter;
  onChange: (value: 'all' | 'in_stock' | 'out_of_stock') => void;
}

export const AvailabilityFilterComponent: React.FC<AvailabilityFilterComponentProps> = ({
  filter,
  onChange,
}) => {
  const options = [
    { value: 'all' as const, label: 'All products' },
    { value: 'in_stock' as const, label: 'In stock only' },
    { value: 'out_of_stock' as const, label: 'Out of stock' },
  ];

  return (
    <select
      value={filter.value}
      onChange={(e) => onChange(e.target.value as 'all' | 'in_stock' | 'out_of_stock')}
      className={`px-4 py-2 text-sm border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium shadow-sm ${
        filter.isActive
          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 shadow-md'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};