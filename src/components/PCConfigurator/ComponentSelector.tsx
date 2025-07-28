'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/supabase/types/types';
import { CompatibilityIssue } from '@/lib/supabase/types/specifications';
import { getCompatibleProducts } from '@/lib/supabase/db';
import ProductCard from '@/components/product/ProductCard';

interface ComponentSelectorProps {
  categorySlug: string;
  selectedComponents: Record<string, string | string[]>;
  selectedProduct: Product | null;
  selectedProducts: Product[];
  onComponentSelect: (categorySlug: string, product: Product | null) => void;
  onMultipleComponentSelect: (categorySlug: string, products: Product[]) => void;
  compatibilityIssues: CompatibilityIssue[];
}

export default function ComponentSelector({
  categorySlug,
  selectedComponents,
  selectedProduct,
  selectedProducts,
  onComponentSelect,
  onMultipleComponentSelect,
  compatibilityIssues,
}: ComponentSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});
  const [specificationFilters, setSpecificationFilters] = useState<Record<string, any>>({});

  // Determine if a category supports multiple selection
  const isMultiSelectCategory = ['memory', 'storage'].includes(categorySlug);

  useEffect(() => {
    loadCompatibleProducts();
  }, [categorySlug, selectedComponents]);

  const loadCompatibleProducts = async () => {
    setIsLoading(true);
    setError(null);

    // Don't try to load products if categorySlug is empty
    if (!categorySlug) {
      setIsLoading(false);
      return;
    }

    try {
      // Get selected components excluding the current category
      const otherComponents = Object.fromEntries(
        Object.entries(selectedComponents).filter(([cat]) => cat !== categorySlug)
      );

      // Convert arrays to strings for a query
      const simpleComponents: Record<string, string> = {};
      Object.entries(otherComponents).forEach(([cat, value]) => {
        if (typeof value === 'string') {
          simpleComponents[cat] = value;
        } else if (Array.isArray(value) && value.length > 0) {
          simpleComponents[cat] = value[0]; // Take first element for compatibility
        }
      });

      const { data, error } = await getCompatibleProducts(categorySlug, simpleComponents);

      if (error) {
        setError('Error loading products');
      } else {
        setProducts(data || []);
      }
    } catch {
      setError('Error loading products');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    // Search by name
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());

    // Price filter
    const matchesPrice =
      (priceRange.min === undefined || product.price >= priceRange.min) &&
      (priceRange.max === undefined || product.price <= priceRange.max);

    return matchesSearch && matchesPrice;
  });

  const handleProductSelect = (product: Product) => {
    if (isMultiSelectCategory) {
      const isSelected = selectedProducts.some(p => p.id === product.id);
      if (isSelected) {
        // Remove from selected
        const newProducts = selectedProducts.filter(p => p.id !== product.id);
        onMultipleComponentSelect(categorySlug, newProducts);
      } else {
        // Add to selected
        onMultipleComponentSelect(categorySlug, [...selectedProducts, product]);
      }
    } else {
      const isSelected = selectedProduct?.id === product.id;
      onComponentSelect(categorySlug, isSelected ? null : product);
    }
  };

  const isProductSelected = (product: Product): boolean => {
    if (isMultiSelectCategory) {
      return selectedProducts.some(p => p.id === product.id);
    }
    return selectedProduct?.id === product.id;
  };

  const getCategoryDisplayName = (slug: string): string => {
    const names: Record<string, string> = {
      processors: 'Processors',
      motherboards: 'Motherboards',
      memory: 'Memory',
      'graphics-cards': 'Graphics Cards',
      storage: 'Storage',
      'power-supplies': 'Power Supplies',
      cases: 'Cases',
      cooling: 'Cooling',
    };
    return names[slug] || slug;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="bg-gray-200 h-32 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b">
        <h3 className="text-xl font-semibold mb-2">
          Select {getCategoryDisplayName(categorySlug)}
        </h3>

        {/* Show compatibility issues */}
        {compatibilityIssues.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <div className="text-sm text-red-800 font-medium mb-1">⚠️ Compatibility Issues:</div>
            {compatibilityIssues.map((issue, index) => (
              <div key={index} className="text-sm text-red-700">
                • {issue.message}
              </div>
            ))}
          </div>
        )}

        {/* Selected components */}
        {isMultiSelectCategory && selectedProducts.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm text-blue-800 font-medium mb-2">
              Selected ({selectedProducts.length}):
            </div>
            <div className="space-y-1">
              {selectedProducts.map(product => (
                <div key={product.id} className="flex justify-between items-center text-sm">
                  <span className="text-blue-700">{product.title}</span>
                  <button
                    onClick={() => handleProductSelect(product)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedProduct && !isMultiSelectCategory && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
            <div className="text-sm text-green-800 font-medium mb-1">✅ Selected:</div>
            <div className="flex justify-between items-center">
              <span className="text-green-700">{selectedProduct.title}</span>
              <button
                onClick={() => onComponentSelect(categorySlug, null)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="number"
            placeholder="Min price"
            value={priceRange.min || ''}
            onChange={e =>
              setPriceRange(prev => ({
                ...prev,
                min: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="number"
            placeholder="Max price"
            value={priceRange.max || ''}
            onChange={e =>
              setPriceRange(prev => ({
                ...prev,
                max: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Products list */}
      <div className="p-6">
        {error ? (
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">{error}</div>
            <button onClick={loadCompatibleProducts} className="text-primary hover:text-primary/80">
              Try Again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No compatible products found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  isProductSelected(product)
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleProductSelect(product)}
              >
                <ProductCard product={product} compact />
                {isProductSelected(product) && (
                  <div className="mt-2 text-center">
                    <span className="text-primary font-medium">Selected</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
