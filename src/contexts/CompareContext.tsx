'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import * as dbService from '@/lib/supabase/db';
import { Product } from '@/lib/supabase/types';
import { useToast } from './ToastContext';

// Define the context type
type CompareContextType = {
  items: CompareItem[];
  itemCount: number;
  isLoading: boolean;
  currentCategory: string | null;
  categoryName: string | null;
  addItem: (productId: string) => Promise<{ error: Error | null }>;
  removeItem: (productId: string) => Promise<{ error: Error | null }>;
  isInCompareList: (productId: string) => boolean;
  clearCompareList: () => Promise<{ error: Error | null }>;
  setViewCategory: (categoryId: string | null) => Promise<{ error: Error | null }>;
  getAvailableCategories: () => { id: string; name: string }[];
};

// Compare item type
export type CompareItem = {
  id: string;
  product: Product;
};

// Create the context with a default value
const CompareContext = createContext<CompareContextType>({
  items: [],
  itemCount: 0,
  isLoading: true,
  currentCategory: null,
  categoryName: null,
  addItem: async () => ({ error: new Error('CompareContext not initialized') }),
  removeItem: async () => ({ error: new Error('CompareContext not initialized') }),
  isInCompareList: () => false,
  clearCompareList: async () => ({ error: new Error('CompareContext not initialized') }),
});

// Local storage key for compare list
const COMPARE_LIST_KEY = 'techcortex_compare_list';

// Maximum number of products that can be compared
const MAX_COMPARE_ITEMS = 4;

// Provider component
export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  const toast = useToast();

  // Calculate derived values
  const itemCount = items.length;

  // Load compare items when component mounts
  useEffect(() => {
    const loadCompareItems = async () => {
      if (authLoading) return;

      setIsLoading(true);

      try {
        // Load compare list from local storage
        const compareList = loadCompareList();

        // If we have product IDs but no product details, fetch them
        const itemsWithProducts: CompareItem[] = [];

        for (const item of compareList) {
          if (!item.product) {
            // Fetch product details
            const { data: product } = await dbService.getProductById(item.id);
            if (product) {
              itemsWithProducts.push({
                id: item.id,
                product: product,
              });
            }
          } else {
            itemsWithProducts.push(item);
          }
        }

        setItems(itemsWithProducts);

        // Automatically select the category with the most products
        if (itemsWithProducts.length > 0) {
          // Count products in each category
          const categoryCounts = new Map<string, number>();
          const categoryNames = new Map<string, string>();

          itemsWithProducts.forEach(item => {
            if (item.product.category_id) {
              const categoryId = item.product.category_id;
              categoryCounts.set(categoryId, (categoryCounts.get(categoryId) || 0) + 1);

              // Store category name if available
              if (item.product.category?.name) {
                categoryNames.set(categoryId, item.product.category.name);
              }
            }
          });

          // Find category with the most products
          let maxCount = 0;
          let optimalCategoryId: string | null = null;

          categoryCounts.forEach((count, categoryId) => {
            if (count > maxCount) {
              maxCount = count;
              optimalCategoryId = categoryId;
            }
          });

          // Set the optimal category
          if (optimalCategoryId) {
            setCurrentCategory(optimalCategoryId);
            setCategoryName(categoryNames.get(optimalCategoryId) || null);

            // If we don't have the category name yet, fetch it
            if (!categoryNames.has(optimalCategoryId)) {
              dbService.getCategoryById(optimalCategoryId)
                .then(({ data }) => {
                  if (data) {
                    setCategoryName(data.name);
                  }
                })
                .catch(err => console.error('Error fetching category name:', err));
            }
          }
        }
      } catch (error) {
        console.error('Error loading compare items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCompareItems();
  }, [authLoading]);

  // Helper functions for compare list
  const loadCompareList = (): CompareItem[] => {
    if (typeof window === 'undefined') return [];

    const compareListJson = localStorage.getItem(COMPARE_LIST_KEY);
    return compareListJson ? JSON.parse(compareListJson) : [];
  };

  const saveCompareList = (compareList: CompareItem[]) => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(COMPARE_LIST_KEY, JSON.stringify(compareList));
  };

  // Check if a product is in the compare list
  const isInCompareList = (productId: string): boolean => {
    return items.some(item => item.product.id === productId);
  };

  // Add item to compare list
  const addItem = async (productId: string) => {
    try {
      // Check if already in compare list
      if (isInCompareList(productId)) {
        toast.info('Product is already in your compare list');
        return { error: null };
      }

      // Check if we've reached the maximum number of items
      if (items.length >= MAX_COMPARE_ITEMS) {
        toast.error(`You can only compare up to ${MAX_COMPARE_ITEMS} products at a time`);
        return { error: new Error(`Maximum of ${MAX_COMPARE_ITEMS} products allowed`) };
      }

      // Fetch product details
      const { data: product, error } = await dbService.getProductById(productId);

      if (error || !product) {
        toast.error('Failed to add product to compare list');
        return { error: error || new Error('Product not found') };
      }

      // We allow adding products from any category
      // No need to set or check category here

      // Add to compare list
      const newItem: CompareItem = {
        id: productId,
        product: product,
      };

      const updatedItems = [...items, newItem];
      setItems(updatedItems);
      saveCompareList(updatedItems);

      toast.success('Product added to compare list');
      return { error: null };
    } catch (error) {
      toast.error('Failed to add product to compare list');
      return { error: error as Error };
    }
  };

  // Remove item from compare list
  const removeItem = async (productId: string) => {
    try {
      const updatedItems = items.filter(item => item.product.id !== productId);
      setItems(updatedItems);
      saveCompareList(updatedItems);

      // If the list is now empty, reset the category
      if (updatedItems.length === 0) {
        setCurrentCategory(null);
        setCategoryName(null);
      }

      toast.success('Product removed from compare list');
      return { error: null };
    } catch (error) {
      toast.error('Failed to remove product from compare list');
      return { error: error as Error };
    }
  };

  // Clear compare list
  const clearCompareList = async () => {
    try {
      setItems([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(COMPARE_LIST_KEY);
      }

      // Reset category
      setCurrentCategory(null);
      setCategoryName(null);

      toast.success('Compare list cleared');
      return { error: null };
    } catch (error) {
      toast.error('Failed to clear compare list');
      return { error: error as Error };
    }
  };

  // Set the category to view in the comparison
  const setViewCategory = async (categoryId: string | null) => {
    try {
      if (categoryId === null) {
        setCurrentCategory(null);
        setCategoryName(null);
        return { error: null };
      }

      // Fetch category name
      try {
        const { data: category } = await dbService.getCategoryById(categoryId);
        if (category) {
          setCurrentCategory(categoryId);
          setCategoryName(category.name);
        } else {
          return { error: new Error('Category not found') };
        }
      } catch (err) {
        console.error('Error fetching category:', err);
        return { error: err as Error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Get all categories that have products in the comparison list
  const getAvailableCategories = () => {
    const categories: { id: string; name: string }[] = [];
    const categoryMap = new Map<string, string>();

    // Collect all unique categories from items
    items.forEach(item => {
      if (item.product.category_id && !categoryMap.has(item.product.category_id)) {
        // We'll store the category name if we have it, otherwise just use the ID
        const name = item.product.category?.name || item.product.category_id;
        categoryMap.set(item.product.category_id, name);
      }
    });

    // Convert map to array
    categoryMap.forEach((name, id) => {
      categories.push({ id, name });
    });

    return categories;
  };

  const value = {
    items,
    itemCount,
    isLoading,
    currentCategory,
    categoryName,
    addItem,
    removeItem,
    isInCompareList,
    clearCompareList,
    setViewCategory,
    getAvailableCategories,
  };

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
};

// Custom hook to use the compare context
export const useCompare = () => {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};
