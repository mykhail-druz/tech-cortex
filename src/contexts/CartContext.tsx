'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as dbService from '@/lib/supabase/db';
import { CartItem, Product } from '@/lib/supabase/types/types';
import debounce from 'lodash.debounce';

// Define the context type
type CartContextType = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  addItem: (productId: string, quantity: number) => Promise<{ error: Error | null }>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<{ error: Error | null }>;
  removeItem: (itemId: string) => Promise<{ error: Error | null }>;
  clearCart: () => Promise<{ error: Error | null }>;
};

// Create the context with a default value
const CartContext = createContext<CartContextType>({
  items: [],
  itemCount: 0,
  subtotal: 0,
  isLoading: true,
  addItem: async () => ({ error: new Error('CartContext not initialized') }),
  updateItemQuantity: async () => ({ error: new Error('CartContext not initialized') }),
  removeItem: async () => ({ error: new Error('CartContext not initialized') }),
  clearCart: async () => ({ error: new Error('CartContext not initialized') }),
});

// Local storage key for guest cart
const GUEST_CART_KEY = 'techcortex_guest_cart';

// Cache duration in milliseconds (30 seconds)
const CACHE_DURATION = 30000;

// Guest cart item type
type GuestCartItem = {
  id: string;
  product_id: string;
  quantity: number;
  product?: Product;
};

// Provider component
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { user, isLoading: authLoading } = useAuth();

  // Calculate derived values
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce(
    (total, item) => total + (item.product?.price || 0) * item.quantity,
    0
  );

  // Load cart items
  const loadCartItems = useCallback(async () => {
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
        const cacheKey = `cart_items_${user.id}`;
        const cachedCartData = sessionStorage.getItem(cacheKey);

        if (cachedCartData) {
          const { data, timestamp } = JSON.parse(cachedCartData);
          if (Date.now() - timestamp < CACHE_DURATION) {
            // Use cached data
            console.log('Using cached cart data');
            setItems(data || []);
            setIsLoading(false);
            setIsInitialized(true);
            return;
          } else {
            // Cache expired, remove it
            sessionStorage.removeItem(cacheKey);
          }
        }

        // Load cart from database
        const { data } = await dbService.getCartItems(user.id, { signal });
        setItems(data || []);

        // Cache the data
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: data || [],
          timestamp: Date.now()
        }));

        // Merge any guest cart items into the user's cart
        const guestCart = loadGuestCart();
        if (guestCart.length > 0) {
          // Add each guest cart item to the user's cart
          for (const item of guestCart) {
            await dbService.addToCart(user.id, item.product_id, item.quantity);
          }

          // Clear the guest cart
          clearGuestCart();

          // Reload the cart
          const { data: updatedData } = await dbService.getCartItems(user.id, { signal });
          setItems(updatedData || []);

          // Update cache
          sessionStorage.setItem(cacheKey, JSON.stringify({
            data: updatedData || [],
            timestamp: Date.now()
          }));
        }
      } else {
        // Guest user: load cart from local storage
        const guestCart = loadGuestCart();
        setItems(guestCart as CartItem[]);
      }

      setIsInitialized(true);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading cart items:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading, isInitialized, isLoading]);

  // Debounced version of loadCartItems
  const debouncedLoadCartItems = useCallback(
    debounce(() => {
      loadCartItems();
    }, 300),
    [loadCartItems]
  );

  // Handle visibility change and initial load
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        debouncedLoadCartItems();
      }
    };

    // Initial load
    loadCartItems();

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadCartItems, debouncedLoadCartItems]);

  // Helper functions for guest cart
  const loadGuestCart = (): GuestCartItem[] => {
    if (typeof window === 'undefined') return [];

    const cartJson = localStorage.getItem(GUEST_CART_KEY);
    return cartJson ? JSON.parse(cartJson) : [];
  };

  const saveGuestCart = (cart: GuestCartItem[]) => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  };

  const clearGuestCart = () => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(GUEST_CART_KEY);
  };

  // Add item to cart
  const addItem = async (productId: string, quantity: number) => {
    try {
      // Cancel any previous requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      if (user) {
        // Logged in user: add to database
        const { error } = await dbService.addToCart(user.id, productId, quantity);
        if (error) return { error };

        // Reload cart
        const { data } = await dbService.getCartItems(user.id, { signal });
        setItems(data || []);

        // Update cache
        const cacheKey = `cart_items_${user.id}`;
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: data || [],
          timestamp: Date.now()
        }));
      } else {
        // Guest user: add to local storage
        const guestCart = loadGuestCart();

        // Check if product already exists in cart
        const existingItemIndex = guestCart.findIndex(item => item.product_id === productId);

        if (existingItemIndex >= 0) {
          // Update quantity if item exists
          guestCart[existingItemIndex].quantity += quantity;
        } else {
          // Add new item
          // Fetch product details
          const { data: products } = await dbService.getProducts({ signal });
          const product = products?.find(p => p.id === productId);

          if (!product) {
            return { error: new Error('Product not found') };
          }

          guestCart.push({
            id: `guest_${Date.now()}`,
            product_id: productId,
            quantity,
            product,
          });
        }

        saveGuestCart(guestCart);
        setItems(guestCart as CartItem[]);
      }

      return { error: null };
    } catch (error) {
      if (error.name !== 'AbortError') {
        return { error: error as Error };
      }
      return { error: null };
    }
  };

  // Update item quantity
  const updateItemQuantity = async (itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        return removeItem(itemId);
      }

      // Cancel any previous requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      if (user) {
        // Logged in user: update in database
        const { error } = await dbService.updateCartItemQuantity(itemId, quantity);
        if (error) return { error };

        // Reload cart
        const { data } = await dbService.getCartItems(user.id, { signal });
        setItems(data || []);

        // Update cache
        const cacheKey = `cart_items_${user.id}`;
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: data || [],
          timestamp: Date.now()
        }));
      } else {
        // Guest user: update in local storage
        const guestCart = loadGuestCart();
        const itemIndex = guestCart.findIndex(item => item.id === itemId);

        if (itemIndex >= 0) {
          guestCart[itemIndex].quantity = quantity;
          saveGuestCart(guestCart);
          setItems(guestCart as CartItem[]);
        }
      }

      return { error: null };
    } catch (error) {
      if (error.name !== 'AbortError') {
        return { error: error as Error };
      }
      return { error: null };
    }
  };

  // Remove item from cart
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
        const { error } = await dbService.removeFromCart(itemId);
        if (error) return { error };

        // Reload cart
        const { data } = await dbService.getCartItems(user.id, { signal });
        setItems(data || []);

        // Update cache
        const cacheKey = `cart_items_${user.id}`;
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: data || [],
          timestamp: Date.now()
        }));
      } else {
        // Guest user: remove from local storage
        const guestCart = loadGuestCart();
        const updatedCart = guestCart.filter(item => item.id !== itemId);
        saveGuestCart(updatedCart);
        setItems(updatedCart as CartItem[]);
      }

      return { error: null };
    } catch (error) {
      if (error.name !== 'AbortError') {
        return { error: error as Error };
      }
      return { error: null };
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      console.log('Clearing cart...');

      // Cancel any previous requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      if (user) {
        // Logged in user: clear in database
        const { error } = await dbService.clearCart(user.id);
        if (error) {
          console.error('Error clearing cart in database:', error);
          return { error };
        }

        console.log('Cart cleared in database');
        setItems([]);

        // Update cache
        const cacheKey = `cart_items_${user.id}`;
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: [],
          timestamp: Date.now()
        }));
      } else {
        // Guest user: clear in local storage
        clearGuestCart();
        console.log('Guest cart cleared');
        setItems([]);
      }

      return { error: null };
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Unexpected error in clearCart:', error);
        return { error: error as Error };
      }
      return { error: null };
    }
  };

  const value = {
    items,
    itemCount,
    subtotal,
    isLoading,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
