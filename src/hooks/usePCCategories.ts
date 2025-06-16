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
        .not('pc_component_type', 'is', null)
        .eq('is_subcategory', false)
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
      'processor': 'Processor',
      'motherboard': 'Motherboard', 
      'memory': 'Memory',
      'graphics-card': 'Graphics Card',
      'storage': 'Storage',
      'power-supply': 'Power Supply',
      'case': 'Case',
      'cooling': 'Cooling',
    };

    return nameMap[category.pc_component_type || ''] || category.name;
  };

  return {
    categories,
    isLoading,
    error,
    refreshCategories,
    getCategoryDisplayName,
  };
};
