import React from 'react';
import { BooleanFilter } from '@/types/filters';

interface BooleanFilterComponentProps {
  filter: BooleanFilter;
  onChange: (value: boolean | null) => void;
}

export const BooleanFilterComponent: React.FC<BooleanFilterComponentProps> = ({
  filter,
  onChange,
}) => {
  const options = [
    { value: null, label: 'Any' },
    { value: true, label: 'Yes' },
    { value: false, label: 'No' },
  ];

  const handleChange = (value: boolean | null) => {
    onChange(value);
  };

  return (
    <select
      value={filter.value?.toString() || 'null'}
      onChange={(e) => {
        const value = e.target.value === 'null' ? null : e.target.value === 'true';
        handleChange(value);
      }}
      className={`px-4 py-2 text-sm border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium shadow-sm ${
        filter.isActive
          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 shadow-md'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      {options.map((option) => (
        <option key={option.value?.toString() || 'null'} value={option.value?.toString() || 'null'}>
          {filter.displayName}: {option.label}
        </option>
      ))}
    </select>
  );
};