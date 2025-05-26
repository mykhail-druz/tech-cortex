'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

interface CartIndicatorProps {
  className?: string;
}

const CartIndicator: React.FC<CartIndicatorProps> = ({ className }) => {
  const { itemCount, isLoading } = useCart();

  return (
    <div className="relative">
      <Link
        href="/cart"
        className={cn(
          'relative flex items-center justify-center p-2 text-gray-700 hover:text-primary transition-colors group',
          className
        )}
        aria-label="Shopping Cart"
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
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
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

export default CartIndicator;
