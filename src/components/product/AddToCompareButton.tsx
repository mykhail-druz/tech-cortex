'use client';

import React, { useState } from 'react';
import { useCompare } from '@/contexts/CompareContext';
import { cn } from '@/lib/utils/utils';

interface AddToCompareButtonProps {
  productId: string;
  className?: string;
  variant?: 'icon' | 'button' | 'icon-button';
}

const AddToCompareButton: React.FC<AddToCompareButtonProps> = ({
  productId,
  className = '',
  variant = 'icon',
}) => {
  const { addItem, removeItem, isInCompareList } = useCompare();
  const isInList = isInCompareList(productId);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggleCompare = async () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    if (isInList) {
      await removeItem(productId);
    } else {
      await addItem(productId);
    }
  };

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <div className="relative">
        <button
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            handleToggleCompare();
          }}
          className={cn(
            'text-gray-500 hover:text-primary transition-all duration-300 bg-white rounded-full p-2 shadow-md hover:shadow-lg',
            isInList ? 'text-primary bg-primary-50' : 'hover:bg-gray-50',
            isAnimating && 'scale-90',
            className
          )}
          aria-label={isInList ? 'Remove from compare' : 'Add to compare'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={cn(
              'h-5 w-5 transition-transform duration-300',
              isInList ? 'scale-110' : 'scale-100'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
            />
          </svg>
        </button>
      </div>
    );
  }

  // Button-only variant
  if (variant === 'button') {
    return (
      <button
        onClick={handleToggleCompare}
        className={cn(
          'px-4 py-2 border rounded-md font-medium transition-all duration-300 shadow-sm hover:shadow-md',
          isInList
            ? 'bg-primary-50 border-primary text-primary hover:bg-primary-100'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50',
          isAnimating && 'scale-95',
          className
        )}
      >
        {isInList ? 'Remove from Compare' : 'Add to Compare'}
      </button>
    );
  }

  // Icon + text button variant
  return (
    <button
      onClick={handleToggleCompare}
      className={cn(
        'px-4 py-2 border rounded-md font-medium flex items-center justify-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md',
        isInList
          ? 'bg-primary-50 border-primary text-primary hover:bg-primary-100'
          : 'border-gray-300 text-gray-700 hover:bg-gray-50',
        isAnimating && 'scale-95',
        className
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          'h-5 w-5 transition-transform duration-300',
          isInList ? 'scale-110' : 'scale-100'
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
        />
      </svg>
      {isInList ? 'Remove from Compare' : 'Add to Compare'}
    </button>
  );
};

export default AddToCompareButton;
