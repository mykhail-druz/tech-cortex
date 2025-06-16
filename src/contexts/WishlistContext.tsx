'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as dbService from '@/lib/supabase/db';
import { WishlistItem, Product } from '@/lib/supabase/types/types';
import { useToast } from './ToastContext';
import debounce from 'lodash.debounce';

// Define the context type
type WishlistContextType = {
  items: WishlistItem[];
  itemCount: number;
  isLoading: boolean;
  addItem: (productId: string) => Promise<{ error: Error | null }>;
  removeItem: (itemId: string) => Promise<{ error: Error | null }>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => Promise<{ error: Error | null }>;
};

// Create the context with a default value
const WishlistContext = createContext<WishlistContextType>({
  items: [],
  itemCount: 0,
  isLoading: true,
  addItem: async () => ({ error: new Error('WishlistContext not initialized') }),
  removeItem: async () => ({ error: new Error('WishlistContext not initialized') }),
  isInWishlist: () => false,
  clearWishlist: async () => ({ error: new Error('WishlistContext not initialized') }),
});

// Local storage key for guest wishlist
const GUEST_WISHLIST_KEY = 'techcortex_guest_wishlist';

// Cache duration in milliseconds (30 seconds)
const CACHE_DURATION = 30000;

// Guest wishlist item type
type GuestWishlistItem = {
  id: string;
  product_id: string;
  product?: Product;
};

// Provider component
export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  const toast = useToast();

  // Calculate derived values
  const itemCount = items.length;

  // Load wishlist items
  const loadWishlistItems = useCallback(async () => {
    if (authLoading) return;

    // If already initialized and not forced, don't load again
    if (isInitialized && !isLoading) return;

    setIsLoading(true);

    try {
      // Cancel any previous requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      if (user) {
        // Logged in user: check cache first
        const cacheKey = `wishlist_items_${user.id}`;
        const cachedWishlistData = sessionStorage.getItem(cacheKey);

        if (cachedWishlistData) {
          const { data, timestamp } = JSON.parse(cachedWishlistData);
          if (Date.now() - timestamp < CACHE_DURATION) {
            // Use cached data
            console.log('Using cached wishlist data');
            setItems(data || []);
            setIsLoading(false);
            setIsInitialized(true);
            return;
          } else {
            // Cache expired, remove it
            sessionStorage.removeItem(cacheKey);
          }
        }

        // Load wishlist from database
        const { data } = await dbService.getWishlistItems(user.id, { signal });
        setItems(data || []);

        // Cache the data
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: data || [],
          timestamp: Date.now()
        }));

        // Merge any guest wishlist items into the user's wishlist
        const guestWishlist = loadGuestWishlist();
        if (guestWishlist.length > 0) {
          // Add each guest wishlist item to the user's wishlist
          for (const item of guestWishlist) {
            // Check if item is already in wishlist
            const isAlreadyInWishlist = await dbService.isInWishlist(user.id, item.product_id, { signal });
            if (!isAlreadyInWishlist) {
              await dbService.addToWishlist(user.id, item.product_id);
            }
          }

          // Clear the guest wishlist
          clearGuestWishlist();

          // Reload the wishlist
          const { data: updatedData } = await dbService.getWishlistItems(user.id, { signal });
          setItems(updatedData || []);

          // Update cache
          sessionStorage.setItem(cacheKey, JSON.stringify({
            data: updatedData || [],
            timestamp: Date.now()
          }));
        }
      } else {
        // Guest user: load wishlist from local storage
        const guestWishlist = loadGuestWishlist();
        setItems(guestWishlist as WishlistItem[]);
      }

      setIsInitialized(true);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading wishlist items:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading, isInitialized, isLoading]);

  // Debounced version of loadWishlistItems
  const debouncedLoadWishlistItems = useCallback(
    debounce(() => {
      loadWishlistItems();
    }, 300),
    [loadWishlistItems]
  );

  // Handle visibility change and initial load
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        debouncedLoadWishlistItems();
      }
    };

    // Initial load
    loadWishlistItems();

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadWishlistItems, debouncedLoadWishlistItems]);

  // Helper functions for guest wishlist
  const loadGuestWishlist = (): GuestWishlistItem[] => {
    if (typeof window === 'undefined') return [];

    const wishlistJson = localStorage.getItem(GUEST_WISHLIST_KEY);
    return wishlistJson ? JSON.parse(wishlistJson) : [];
  };

  const saveGuestWishlist = (wishlist: GuestWishlistItem[]) => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlist));
  };

  const clearGuestWishlist = () => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(GUEST_WISHLIST_KEY);
  };

  // Check if a product is in the wishlist
  const isInWishlist = (productId: string): boolean => {
    return items.some(item => item.product_id === productId);
  };

  // Add item to wishlist
  const addItem = async (productId: string) => {
    try {
      // Check if already in wishlist
      if (isInWishlist(productId)) {
        toast.info('Item is already in your wishlist');
        return { error: null };
      }

      // Cancel any previous requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      if (user) {
        // Logged in user: add to database
        const { error } = await dbService.addToWishlist(user.id, productId);
        if (error) return { error };

        // Reload wishlist
        const { data } = await dbService.getWishlistItems(user.id, { signal });
        setItems(data || []);

        // Update cache
        const cacheKey = `wishlist_items_${user.id}`;
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: data || [],
          timestamp: Date.now()
        }));
      } else {
        // Guest user: add to local storage
        const guestWishlist = loadGuestWishlist();

        // Check if product already exists in wishlist
        const existingItem = guestWishlist.find(item => item.product_id === productId);

        if (!existingItem) {
          // Fetch product details
          const { data: products } = await dbService.getProducts({ signal });
          const product = products?.find(p => p.id === productId);

          if (!product) {
            return { error: new Error('Product not found') };
          }

          guestWishlist.push({
            id: `guest_${Date.now()}`,
            product_id: productId,
            product,
          });

          saveGuestWishlist(guestWishlist);
          setItems(guestWishlist as WishlistItem[]);
        }
      }

      toast.success('Item added to wishlist');
      return { error: null };
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('Failed to add item to wishlist');
        return { error: error as Error };
      }
      return { error: null };
    }
  };

  // Remove item from wishlist
  const removeItem = async (itemId: string) => {
    try {
      // Cancel any previous requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      if (user) {
        // Logged in user: remove from database
        const { error } = await dbService.removeFromWishlist(itemId);
        if (error) return { error };

        // Reload wishlist
        const { data } = await dbService.getWishlistItems(user.id, { signal });
        setItems(data || []);

        // Update cache
        const cacheKey = `wishlist_items_${user.id}`;
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: data || [],
          timestamp: Date.now()
        }));
      } else {
        // Guest user: remove from local storage
        const guestWishlist = loadGuestWishlist();
        const updatedWishlist = guestWishlist.filter(item => item.id !== itemId);
        saveGuestWishlist(updatedWishlist);
        setItems(updatedWishlist as WishlistItem[]);
      }

      toast.success('Item removed from wishlist');
      return { error: null };
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('Failed to remove item from wishlist');
        return { error: error as Error };
      }
      return { error: null };
    }
  };

  // Clear wishlist
  const clearWishlist = async () => {
    try {
      // Cancel any previous requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      if (user) {
        // For logged in users, we would need to implement a clearWishlist function in dbService
        // Since it doesn't exist, we'll remove items one by one
        for (const item of items) {
          await dbService.removeFromWishlist(item.id);
        }

        setItems([]);

        // Update cache
        const cacheKey = `wishlist_items_${user.id}`;
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: [],
          timestamp: Date.now()
        }));
      } else {
        // Guest user: clear in local storage
        clearGuestWishlist();
        setItems([]);
      }

      toast.success('Wishlist cleared');
      return { error: null };
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('Failed to clear wishlist');
        return { error: error as Error };
      }
      return { error: null };
    }
  };

  const value = {
    items,
    itemCount,
    isLoading,
    addItem,
    removeItem,
    isInWishlist,
    clearWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

// Custom hook to use the wishlist context
export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
