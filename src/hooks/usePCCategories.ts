'use client';

import { useState, useEffect } from 'react';
import { Category } from '@/lib/supabase/types/types';
import { supabase } from '@/lib/supabaseClient';

export const usePCCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPCCategories();
  }, []);

  const loadPCCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_pc_component', true)
        .order('pc_display_order');

      if (fetchError) {
        throw fetchError;
      }

      setCategories(data || []);
    } catch (err) {
      console.error('Error loading PC categories:', err);
      setError('Failed to load PC categories');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCategories = () => {
    loadPCCategories();
  };

  // Create name mapping for localization
  const getCategoryDisplayName = (category: Category): string => {
    const nameMap: Record<string, string> = {
      'processors': 'Processor',
      'motherboards': 'Motherboard', 
      'memory': 'Memory',
      'graphics-cards': 'Graphics Card',
      'storage': 'Storage',
      'power-supplies': 'Power Supply',
      'cases': 'Case',
      'cooling': 'Cooling',
    };

    return nameMap[category.slug] || category.name;
  };

  return {
    categories,
    isLoading,
    error,
    refreshCategories,
    getCategoryDisplayName,
  };
};
