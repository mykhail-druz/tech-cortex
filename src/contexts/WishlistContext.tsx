'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import * as dbService from '@/lib/supabase/db';
import { WishlistItem, Product } from '@/lib/supabase/types';
import { useToast } from './ToastContext';

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
  const { user, isLoading: authLoading } = useAuth();
  const toast = useToast();

  // Calculate derived values
  const itemCount = items.length;

  // Load wishlist items when auth state changes
  useEffect(() => {
    const loadWishlistItems = async () => {
      if (authLoading) return;
      
      setIsLoading(true);
      
      try {
        if (user) {
          // Logged in user: load wishlist from database
          const { data } = await dbService.getWishlistItems(user.id);
          setItems(data || []);
          
          // Merge any guest wishlist items into the user's wishlist
          const guestWishlist = loadGuestWishlist();
          if (guestWishlist.length > 0) {
            // Add each guest wishlist item to the user's wishlist
            for (const item of guestWishlist) {
              // Check if item is already in wishlist
              const isAlreadyInWishlist = await dbService.isInWishlist(user.id, item.product_id);
              if (!isAlreadyInWishlist) {
                await dbService.addToWishlist(user.id, item.product_id);
              }
            }
            
            // Clear the guest wishlist
            clearGuestWishlist();
            
            // Reload the wishlist
            const { data: updatedData } = await dbService.getWishlistItems(user.id);
            setItems(updatedData || []);
          }
        } else {
          // Guest user: load wishlist from local storage
          const guestWishlist = loadGuestWishlist();
          setItems(guestWishlist as WishlistItem[]);
        }
      } catch (error) {
        console.error('Error loading wishlist items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWishlistItems();
  }, [user, authLoading]);

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

      if (user) {
        // Logged in user: add to database
        const { error } = await dbService.addToWishlist(user.id, productId);
        if (error) return { error };
        
        // Reload wishlist
        const { data } = await dbService.getWishlistItems(user.id);
        setItems(data || []);
      } else {
        // Guest user: add to local storage
        const guestWishlist = loadGuestWishlist();
        
        // Check if product already exists in wishlist
        const existingItem = guestWishlist.find(item => item.product_id === productId);
        
        if (!existingItem) {
          // Fetch product details
          const { data: products } = await dbService.getProducts();
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
      toast.error('Failed to add item to wishlist');
      return { error: error as Error };
    }
  };

  // Remove item from wishlist
  const removeItem = async (itemId: string) => {
    try {
      if (user) {
        // Logged in user: remove from database
        const { error } = await dbService.removeFromWishlist(itemId);
        if (error) return { error };
        
        // Reload wishlist
        const { data } = await dbService.getWishlistItems(user.id);
        setItems(data || []);
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
      toast.error('Failed to remove item from wishlist');
      return { error: error as Error };
    }
  };

  // Clear wishlist
  const clearWishlist = async () => {
    try {
      if (user) {
        // For logged in users, we would need to implement a clearWishlist function in dbService
        // Since it doesn't exist, we'll remove items one by one
        for (const item of items) {
          await dbService.removeFromWishlist(item.id);
        }
        
        setItems([]);
      } else {
        // Guest user: clear in local storage
        clearGuestWishlist();
        setItems([]);
      }
      
      toast.success('Wishlist cleared');
      return { error: null };
    } catch (error) {
      toast.error('Failed to clear wishlist');
      return { error: error as Error };
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