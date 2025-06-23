'use client';

import React from 'react';
import Link from 'next/link';
import { useCompare } from '@/contexts/CompareContext';
import { cn } from '@/lib/utils/utils';

interface CompareIndicatorProps {
  className?: string;
}

const CompareIndicator: React.FC<CompareIndicatorProps> = ({ className }) => {
  const { itemCount, isLoading } = useCompare();

  // Always show the compare icon, even if there are no items
  return (
    <div className="relative">
      <Link
        href="/compare"
        className={cn(
          'relative flex items-center justify-center p-2 text-gray-700 hover:text-primary transition-colors group',
          className
        )}
        aria-label="Compare products"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 transform transition-transform duration-300 group-hover:scale-110"
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

        {/* Item count badge - only show if there are items */}
        {!isLoading && itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse-once">
            {itemCount}
          </span>
        )}
      </Link>
    </div>
  );
};

export default CompareIndicator;
