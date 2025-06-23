'use client';

import React from 'react';
import Link from 'next/link';
import { useWishlist } from '@/contexts/WishlistContext';
import { cn } from '@/lib/utils/utils';

interface WishlistIndicatorProps {
  className?: string;
}

const WishlistIndicator: React.FC<WishlistIndicatorProps> = ({ className }) => {
  const { itemCount, isLoading } = useWishlist();

  return (
    <div className="relative">
      <Link
        href="/account/wishlist"
        className={cn(
          'relative flex items-center justify-center p-2 text-gray-700 hover:text-primary transition-colors group',
          className
        )}
        aria-label="Wishlist"
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
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>

        {/* Item count badge - only show if there are items */}
        {!isLoading && itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse-once">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </Link>
    </div>
  );
};

export default WishlistIndicator;
