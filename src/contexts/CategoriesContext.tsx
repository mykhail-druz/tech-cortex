'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCategories } from '@/lib/supabase/db';
import { Category } from '@/lib/supabase/types/types';

type CategoriesContextType = {
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
  refetchCategories: () => Promise<void>;
};

const CategoriesContext = createContext<CategoriesContextType>({
  categories: [],
  isLoading: true,
  error: null,
  refetchCategories: async () => {},
});

interface CategoriesProviderProps {
  children: ReactNode;
}

export const CategoriesProvider = ({ children }: CategoriesProviderProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Проверяем кеш в localStorage
      const cachedData = localStorage.getItem('categories_cache');
      const cacheTimestamp = localStorage.getItem('categories_cache_timestamp');
      const CACHE_DURATION = 5 * 60 * 1000; // 5 минут
      
      if (cachedData && cacheTimestamp) {
        const isExpired = Date.now() - parseInt(cacheTimestamp) > CACHE_DURATION;
        if (!isExpired) {
          setCategories(JSON.parse(cachedData));
          setIsLoading(false);
          return;
        }
      }

      const { data, error } = await getCategories();
      if (error) {
        setError(error);
      } else {
        setCategories(data || []);
        // Сохраняем в кеш
        localStorage.setItem('categories_cache', JSON.stringify(data || []));
        localStorage.setItem('categories_cache_timestamp', Date.now().toString());
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const value = {
    categories,
    isLoading,
    error,
    refetchCategories: fetchCategories,
  };

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
};