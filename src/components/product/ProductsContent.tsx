'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductGrid from '@/components/product/ProductGrid';
import ProductSkeleton from '@/components/product/ProductSkeleton';
import { cn } from '@/lib/utils/utils';
import {
  getProducts,
  getCategories,
  searchProductsWithSpecifications,
  getProductsWithSpecificationFilters,
} from '@/lib/supabase/db';
import { Product, Category } from '@/lib/supabase/types/types';
import FilterSidebar from '@/components/ProductFilters/FilterSidebar';
import MobileFilterDrawer from '@/components/ProductFilters/MobileFilterDrawer';

// Define sorting options
const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Rating', value: 'rating' },
];

export default function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Get all filter parameters from URL
  const query = searchParams.get('q') || '';
  const categorySlug = searchParams.get('category') || 'all';
  const subcategorySlug = searchParams.get('subcategory') || '';
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 0;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 2000;
  const sortBy = searchParams.get('sort') || 'newest';
  const inStockOnly = searchParams.get('inStock') === 'true';
  const viewMode = (searchParams.get('view') || 'grid') as 'grid' | 'list';

  // Get specification filters from URL
  const specFiltersParam = searchParams.get('specs');
  const initialSpecFilters = specFiltersParam ? JSON.parse(specFiltersParam) : {};

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(query);
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>([minPrice, maxPrice]);
  const [specFilters, setSpecFilters] = useState<Record<string, any>>(initialSpecFilters);

  // Load saved filters from localStorage on initial render
  useEffect(() => {
    // Only load saved filters if there are no URL parameters
    if (!searchParams.has('category') && !searchParams.has('q')) {
      try {
        const savedFilters = localStorage.getItem('productFilters');
        if (savedFilters) {
          const filters = JSON.parse(savedFilters);

          // Build URL parameters from saved filters
          const params = new URLSearchParams();

          if (filters.category) params.set('category', filters.category);
          if (filters.subcategory) params.set('subcategory', filters.subcategory);
          if (filters.minPrice > 0) params.set('minPrice', filters.minPrice.toString());
          if (filters.maxPrice < 2000) params.set('maxPrice', filters.maxPrice.toString());
          if (filters.sort) params.set('sort', filters.sort);
          if (filters.inStock) params.set('inStock', 'true');
          if (filters.view) params.set('view', filters.view);
          if (filters.specs && Object.keys(filters.specs).length > 0) {
            params.set('specs', JSON.stringify(filters.specs));
          }

          // Navigate to the URL with saved filters
          if (params.toString()) {
            router.push(`/products?${params.toString()}`);
          }
        }
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }
  }, []);

  // Save filters to localStorage when they change
  useEffect(() => {
    // Save current filters
    const currentFilters = {
      category: categorySlug,
      subcategory: subcategorySlug,
      minPrice: minPrice,
      maxPrice: maxPrice,
      sort: sortBy,
      inStock: inStockOnly,
      view: viewMode,
      specs: specFilters,
    };

    localStorage.setItem('productFilters', JSON.stringify(currentFilters));
  }, [
    categorySlug,
    subcategorySlug,
    minPrice,
    maxPrice,
    sortBy,
    inStockOnly,
    viewMode,
    specFilters,
  ]);

  // Fetch categories only once when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Check if we have cached categories
        const cachedCategories = localStorage.getItem('cachedCategories');
        if (cachedCategories) {
          // Use cached categories immediately
          setCategories(JSON.parse(cachedCategories));
          setIsCategoriesLoading(false);
        } else {
          // No cache, show loading state
          setIsCategoriesLoading(true);
        }

        // Always fetch fresh categories in the background
        const { data: categoriesData, error: categoriesError } = await getCategories();
        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
        } else if (categoriesData) {
          // Update state with fresh data
          setCategories(categoriesData);
          // Cache the categories for future use
          localStorage.setItem('cachedCategories', JSON.stringify(categoriesData));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products when URL parameters change
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsProductsLoading(true);

        // Fetch products - use search if query is provided
        let productsData;
        let productsError;

        const hasSpecFilters = Object.keys(specFilters).length > 0;

        if (query) {
          const searchResult = await searchProductsWithSpecifications(
            query,
            categorySlug !== 'all' ? categorySlug : undefined,
            subcategorySlug || undefined,
            minPrice > 0 ? minPrice : undefined,
            maxPrice < 2000 ? maxPrice : undefined,
            sortBy as any,
            inStockOnly,
            hasSpecFilters ? specFilters : undefined
          );
          productsData = searchResult.data;
          productsError = searchResult.error;
        } else if (hasSpecFilters) {
          // Use specification filters
          const productsResult = await getProductsWithSpecificationFilters(
            categorySlug !== 'all' ? categorySlug : undefined,
            specFilters,
            minPrice > 0 ? minPrice : undefined,
            maxPrice < 2000 ? maxPrice : undefined,
            sortBy as any,
            inStockOnly
          );
          productsData = productsResult.data;
          productsError = productsResult.error;
        } else {
          // Regular product fetching without specification filters
          const productsResult = await getProducts(
            categorySlug !== 'all' ? categorySlug : undefined,
            subcategorySlug || undefined,
            minPrice > 0 ? minPrice : undefined,
            maxPrice < 2000 ? maxPrice : undefined,
            sortBy as any,
            inStockOnly
          );
          productsData = productsResult.data;
          productsError = productsResult.error;
        }

        if (productsError) {
          console.error('Error fetching products:', productsError);
        } else {
          setProducts(productsData || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsProductsLoading(false);
      }
    };

    fetchProducts();

    // Update local price range when URL parameters change
    setLocalPriceRange([minPrice, maxPrice]);
    setSearchTerm(query);
    setSpecFilters(initialSpecFilters);
  }, [
    query,
    categorySlug,
    subcategorySlug,
    minPrice,
    maxPrice,
    sortBy,
    inStockOnly,
    specFiltersParam,
  ]);

  // Update URL with filter parameters
  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Update or remove parameters based on the updates object
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Build the new URL
    const newUrl = `/products${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl);
  };

  // Handle category change
  const handleCategoryChange = (category: string, subcategory: string = '') => {
    const updates: Record<string, string | null> = {
      category,
      subcategory: subcategory || null,
    };
    updateFilters(updates);
  };

  // Handle price range change
  const handlePriceChange = (min: number, max: number) => {
    setLocalPriceRange([min, max]);
  };

  // Apply price filter
  const applyPriceFilter = () => {
    updateFilters({
      minPrice: localPriceRange[0] > 0 ? localPriceRange[0].toString() : null,
      maxPrice: localPriceRange[1] < 2000 ? localPriceRange[1].toString() : null,
    });
  };

  // Handle sort change
  const handleSortChange = (sort: string) => {
    updateFilters({ sort });
  };

  // Handle view mode change
  const handleViewModeChange = (view: 'grid' | 'list') => {
    updateFilters({ view });
  };

  // Handle in-stock filter change
  const handleInStockChange = (checked: boolean) => {
    updateFilters({ inStock: checked ? 'true' : null });
  };

  // Handle specification filters change
  const handleSpecFiltersChange = (filters: Record<string, any>) => {
    setSpecFilters(filters);
    const hasFilters = Object.keys(filters).length > 0;
    updateFilters({ specs: hasFilters ? JSON.stringify(filters) : null });
  };

  // Handle search form submission
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      updateFilters({ q: searchTerm.trim() });
    } else {
      updateFilters({ q: null });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {query ? `Search Results for "${query}"` : 'Product Catalog'}
      </h1>

      {/* Mobile filter button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsMobileFiltersOpen(true)}
          className="w-full py-2 bg-gray-100 text-gray-800 rounded-md flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Фильтры
          {Object.keys(specFilters).length > 0 && (
            <span className="ml-1 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {Object.keys(specFilters).length}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter sidebar */}
        <FilterSidebar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          handleSearch={handleSearch}
          query={query}
          updateFilters={updateFilters}
          categories={categories}
          isCategoriesLoading={isCategoriesLoading}
          categorySlug={categorySlug}
          subcategorySlug={subcategorySlug}
          handleCategoryChange={handleCategoryChange}
          localPriceRange={localPriceRange}
          handlePriceChange={handlePriceChange}
          inStockOnly={inStockOnly}
          handleInStockChange={handleInStockChange}
          handleSpecFiltersChange={handleSpecFiltersChange}
          applyPriceFilter={applyPriceFilter}
        />

        {/* Products section */}
        <div className="flex-grow">
          {/* Sorting and view options */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <span className="text-sm text-gray-600 mr-2">Сортировать:</span>
              <select
                value={sortBy}
                onChange={e => handleSortChange(e.target.value)}
                className="rounded-md border-gray-300 py-1 pl-3 pr-8 text-sm focus:ring-primary focus:border-primary"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={cn(
                  'p-2 rounded-md',
                  viewMode === 'grid'
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={cn(
                  'p-2 rounded-md',
                  viewMode === 'list'
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Product grid */}
          {isProductsLoading ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div
                className={`grid gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1'
                }`}
              >
                {Array(8)
                  .fill(0)
                  .map((_, index) => (
                    <ProductSkeleton key={index} layout={viewMode} />
                  ))}
              </div>
            </div>
          ) : (
            <ProductGrid
              products={products.map(product => {
                // Find category
                const category = categories.find(c => c.id === product.category_id);

                // Find subcategory
                let subcategory;
                if (product.subcategory_id) {
                  // Look for subcategory in all categories
                  for (const cat of categories) {
                    if (cat.subcategories) {
                      subcategory = cat.subcategories.find(s => s.id === product.subcategory_id);
                      if (subcategory) break;
                    }
                  }
                }

                return {
                  id: product.id,
                  title: product.title,
                  price: product.price,
                  oldPrice: product.old_price || undefined,
                  image: product.main_image_url || '/api/placeholder/300/300',
                  category: category?.name || '',
                  subcategory: subcategory?.name,
                  rating: product.rating,
                  inStock: product.in_stock,
                  slug: product.slug,
                };
              })}
              title=""
              layout={viewMode}
            />
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <MobileFilterDrawer
        isOpen={isMobileFiltersOpen}
        onClose={() => setIsMobileFiltersOpen(false)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={handleSearch}
        query={query}
        updateFilters={updateFilters}
        categories={categories}
        isCategoriesLoading={isCategoriesLoading}
        categorySlug={categorySlug}
        subcategorySlug={subcategorySlug}
        handleCategoryChange={handleCategoryChange}
        localPriceRange={localPriceRange}
        handlePriceChange={handlePriceChange}
        inStockOnly={inStockOnly}
        handleInStockChange={handleInStockChange}
        handleSpecFiltersChange={handleSpecFiltersChange}
        applyPriceFilter={applyPriceFilter}
      />
    </div>
  );
}
