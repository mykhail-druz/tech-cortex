'use client';

import React from 'react';
import { useWishlist } from '@/contexts/WishlistContext';
import { cn } from '@/lib/utils';

interface AddToWishlistButtonProps {
  productId: string;
  className?: string;
  variant?: 'icon' | 'button' | 'icon-button';
}

const AddToWishlistButton: React.FC<AddToWishlistButtonProps> = ({
  productId,
  className = '',
  variant = 'icon',
}) => {
  const { addItem, removeItem, isInWishlist, items } = useWishlist();
  const isInList = isInWishlist(productId);

  const handleToggleWishlist = async () => {
    if (isInList) {
      // Find the wishlist item to remove
      const wishlistItem = items.find(item => item.product_id === productId);
      if (wishlistItem) {
        await removeItem(wishlistItem.id);
      }
    } else {
      await addItem(productId);
    }
  };

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleToggleWishlist();
        }}
        className={cn(
          'text-gray-500 hover:text-primary transition-colors bg-white rounded-full p-1.5 shadow-sm',
          isInList && 'text-red-500 hover:text-red-600',
          className
        )}
        aria-label={isInList ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill={isInList ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={isInList ? 0 : 1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>
    );
  }

  // Button-only variant
  if (variant === 'button') {
    return (
      <button
        onClick={handleToggleWishlist}
        className={cn(
          'px-4 py-2 border rounded-md font-medium transition-colors',
          isInList
            ? 'border-red-500 text-red-500 hover:bg-red-50'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50',
          className
        )}
      >
        {isInList ? 'Remove from Wishlist' : 'Add to Wishlist'}
      </button>
    );
  }

  // Icon + text button variant
  return (
    <button
      onClick={handleToggleWishlist}
      className={cn(
        'px-4 py-2 border rounded-md font-medium flex items-center justify-center gap-2 transition-colors',
        isInList
          ? 'border-red-500 text-red-500 hover:bg-red-50'
          : 'border-gray-300 text-gray-700 hover:bg-gray-50',
        className
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill={isInList ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={isInList ? 0 : 1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {isInList ? 'Remove from Wishlist' : 'Add to Wishlist'}
    </button>
  );
};

export default AddToWishlistButton;
