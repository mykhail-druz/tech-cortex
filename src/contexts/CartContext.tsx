'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import * as dbService from '@/lib/supabase/db';
import { CartItem, Product } from '@/lib/supabase/types';

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
  const { user, isLoading: authLoading } = useAuth();

  // Calculate derived values
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce(
    (total, item) => total + (item.product?.price || 0) * item.quantity,
    0
  );

  // Load cart items when auth state changes
  useEffect(() => {
    const loadCartItems = async () => {
      if (authLoading) return;
      
      setIsLoading(true);
      
      try {
        if (user) {
          // Logged in user: load cart from database
          const { data } = await dbService.getCartItems(user.id);
          setItems(data || []);
          
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
            const { data: updatedData } = await dbService.getCartItems(user.id);
            setItems(updatedData || []);
          }
        } else {
          // Guest user: load cart from local storage
          const guestCart = loadGuestCart();
          setItems(guestCart as CartItem[]);
        }
      } catch (error) {
        console.error('Error loading cart items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCartItems();
  }, [user, authLoading]);

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
      if (user) {
        // Logged in user: add to database
        const { error } = await dbService.addToCart(user.id, productId, quantity);
        if (error) return { error };
        
        // Reload cart
        const { data } = await dbService.getCartItems(user.id);
        setItems(data || []);
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
          const { data: products } = await dbService.getProducts();
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
      return { error: error as Error };
    }
  };

  // Update item quantity
  const updateItemQuantity = async (itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        return removeItem(itemId);
      }
      
      if (user) {
        // Logged in user: update in database
        const { error } = await dbService.updateCartItemQuantity(itemId, quantity);
        if (error) return { error };
        
        // Reload cart
        const { data } = await dbService.getCartItems(user.id);
        setItems(data || []);
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
      return { error: error as Error };
    }
  };

  // Remove item from cart
  const removeItem = async (itemId: string) => {
    try {
      if (user) {
        // Logged in user: remove from database
        const { error } = await dbService.removeFromCart(itemId);
        if (error) return { error };
        
        // Reload cart
        const { data } = await dbService.getCartItems(user.id);
        setItems(data || []);
      } else {
        // Guest user: remove from local storage
        const guestCart = loadGuestCart();
        const updatedCart = guestCart.filter(item => item.id !== itemId);
        saveGuestCart(updatedCart);
        setItems(updatedCart as CartItem[]);
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      if (user) {
        // Logged in user: clear in database
        const { error } = await dbService.clearCart(user.id);
        if (error) return { error };
        
        setItems([]);
      } else {
        // Guest user: clear in local storage
        clearGuestCart();
        setItems([]);
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
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