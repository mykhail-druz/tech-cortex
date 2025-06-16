'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import * as dbService from '@/lib/supabase/db';
import { WishlistItem } from '@/lib/supabase/types/types';

export default function WishlistPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/account/wishlist');
    }
  }, [user, authLoading, router]);

  // Fetch wishlist items when user is available
  useEffect(() => {
    const fetchWishlistItems = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await dbService.getWishlistItems(user.id);

        if (error) {
          setError('Failed to load wishlist items. Please try again.');
          console.error(error);
          return;
        }

        setWishlistItems(data || []);
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchWishlistItems();
    }
  }, [user]);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Remove item from wishlist
  const handleRemoveItem = async (itemId: string) => {
    try {
      const { error } = await dbService.removeFromWishlist(itemId);

      if (error) {
        setError('Failed to remove item from wishlist. Please try again.');
        console.error(error);
        return;
      }

      // Update wishlist items
      setWishlistItems(wishlistItems.filter(item => item.id !== itemId));
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    }
  };

  // Add item to cart
  const handleAddToCart = async (productId: string) => {
    try {
      const { error } = await dbService.addToCart(user!.id, productId, 1);

      if (error) {
        setError('Failed to add item to cart. Please try again.');
        toast.error('Failed to add item to cart');
        console.error(error);
        return;
      }

      // Show success message
      toast.success('Item added to cart');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      toast.error('An unexpected error occurred');
      console.error(err);
    }
  };

  if (authLoading || (isLoading && !error)) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">My Wishlist</h1>
          <div className="bg-white rounded-lg shadow-md p-8 flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">My Wishlist</h1>
          <Link href="/account" className="text-primary hover:text-primary/80 text-sm font-medium">
            Back to Account
          </Link>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">{error}</div>}

        {wishlistItems.length === 0 && !isLoading && !error ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h2 className="text-xl font-medium text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">
              Save items you like to your wishlist and they&apos;ll appear here.
            </p>
            <Link
              href="/products"
              className="inline-block bg-primary text-white py-2 px-6 rounded-md hover:bg-primary/90 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {wishlistItems.map(item => (
                <li key={item.id} className="p-6">
                  <div className="flex flex-col sm:flex-row">
                    {/* Product image */}
                    <div className="flex-shrink-0 w-full sm:w-24 h-24 mb-4 sm:mb-0 relative">
                      <div className="relative h-full w-full">
                        <Image
                          src={item.product?.main_image_url || '/api/placeholder/100/100'}
                          alt={item.product?.title || 'Product'}
                          fill
                          sizes="(max-width: 768px) 100vw, 100px"
                          className="object-contain"
                        />
                      </div>
                    </div>

                    {/* Product details */}
                    <div className="flex-1 sm:ml-6">
                      <div className="flex flex-col sm:flex-row justify-between">
                        <div>
                          <h3 className="text-base font-medium text-gray-900">
                            <Link
                              href={`/products/${item.product?.slug || item.product_id}`}
                              className="hover:text-primary"
                            >
                              {item.product?.title || 'Product'}
                            </Link>
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {item.product?.brand || 'Brand'}
                          </p>
                        </div>
                        <div className="mt-2 sm:mt-0 text-right">
                          <p className="text-base font-medium text-gray-900">
                            {item.product?.price ? formatPrice(item.product.price) : 'N/A'}
                          </p>
                          {item.product?.old_price && (
                            <p className="text-sm text-gray-500 line-through">
                              {formatPrice(item.product.old_price)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => item.product && handleAddToCart(item.product.id)}
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                            disabled={!item.product?.in_stock}
                          >
                            {item.product?.in_stock ? 'Add to Cart' : 'Out of Stock'}
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="mt-2 sm:mt-0">
                          {item.product?.in_stock ? (
                            <span className="text-sm text-green-600">In Stock</span>
                          ) : (
                            <span className="text-sm text-red-600">Out of Stock</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
