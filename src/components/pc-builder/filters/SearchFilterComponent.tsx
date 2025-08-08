import React from 'react';
import { SearchFilter } from '@/types/filters';

interface SearchFilterComponentProps {
  filter: SearchFilter;
  onChange: (value: string) => void;
}

export const SearchFilterComponent: React.FC<SearchFilterComponentProps> = ({
  filter,
  onChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={filter.value}
        onChange={handleChange}
        placeholder={filter.placeholder}
        className={`px-4 py-2 text-sm border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm ${
          filter.value 
            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 w-48 shadow-md' 
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-md w-40'
        }`}
      />
      {filter.value && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-2 flex items-center text-xs text-gray-500 hover:text-gray-700"
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
};