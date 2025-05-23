'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductGrid from '@/components/product/ProductGrid';
import { cn } from '@/lib/utils';
import { getProducts, getCategories, searchProducts } from '@/lib/supabase/db';
import { Product, Category } from '@/lib/supabase/types';

// Define sorting options
const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Rating', value: 'rating' },
];

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Product Catalog</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
        <div className="flex-grow">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading products...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component that uses useSearchParams
function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(query);

  // Fetch products and categories on component mount or when query changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch products - use search if query is provided
        let productsData;
        let productsError;

        if (query) {
          const searchResult = await searchProducts(
            query,
            activeCategory !== 'all' ? activeCategory : undefined,
            priceRange[0] > 0 ? priceRange[0] : undefined,
            priceRange[1] < 2000 ? priceRange[1] : undefined
          );
          productsData = searchResult.data;
          productsError = searchResult.error;
        } else {
          const productsResult = await getProducts();
          productsData = productsResult.data;
          productsError = productsResult.error;
        }

        if (productsError) {
          console.error('Error fetching products:', productsError);
        } else {
          setProducts(productsData || []);
        }

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await getCategories();
        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
        } else {
          setCategories(categoriesData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [query, activeCategory, priceRange]);

  // Helper for slider range inputs
  const handlePriceChange = (min: number, max: number) => {
    setPriceRange([min, max]);
  };

  // Handle search form submission
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push('/products');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {query ? `Search Results for "${query}"` : "Product Catalog"}
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-lg mb-4">Filters</h2>

            {/* Search */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Search</h3>
              <form onSubmit={handleSearch} className="flex items-center">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </div>
              </form>
              {query && (
                <div className="mt-2 flex items-center">
                  <span className="text-sm text-gray-600 mr-2">Searching for: "{query}"</span>
                  <button 
                    onClick={() => router.push('/products')}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Categories</h3>
              {isLoading ? (
                <div className="text-gray-400 py-2">Loading...</div>
              ) : (
                <ul className="space-y-2">
                  <li>
                    <button
                      className={cn(
                        'w-full text-left py-1 px-2 rounded-md text-sm transition-colors',
                        activeCategory === 'all'
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                      onClick={() => {
                        setActiveCategory('all');
                        setActiveSubcategory('');
                      }}
                    >
                      All
                    </button>
                  </li>
                  {categories.map(category => (
                    <li key={category.id} className="space-y-1">
                      <button
                        className={cn(
                          'w-full text-left py-1 px-2 rounded-md text-sm transition-colors',
                          activeCategory === category.slug && !activeSubcategory
                            ? 'bg-primary/10 text-primary'
                            : 'text-gray-600 hover:bg-gray-100'
                        )}
                        onClick={() => {
                          setActiveCategory(category.slug);
                          setActiveSubcategory('');
                        }}
                      >
                        {category.name}
                      </button>

                      {/* Subcategories */}
                      {activeCategory === category.slug && category.subcategories && category.subcategories.length > 0 && (
                        <ul className="pl-4 space-y-1 mt-1">
                          {category.subcategories.map(subcategory => (
                            <li key={subcategory.id}>
                              <button
                                className={cn(
                                  'w-full text-left py-1 px-2 rounded-md text-sm transition-colors',
                                  activeSubcategory === subcategory.slug
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-gray-600 hover:bg-gray-100'
                                )}
                                onClick={() => {
                                  setActiveCategory(category.slug);
                                  setActiveSubcategory(subcategory.slug);
                                }}
                              >
                                {subcategory.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Price range */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Price</h3>
              <div className="px-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">${priceRange[0]}</span>
                  <span className="text-sm text-gray-600">${priceRange[1]}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2000}
                  value={priceRange[0]}
                  onChange={e => handlePriceChange(Number(e.target.value), priceRange[1])}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="range"
                  min={0}
                  max={2000}
                  value={priceRange[1]}
                  onChange={e => handlePriceChange(priceRange[0], Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
                />
              </div>
            </div>

            {/* In stock only */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="ml-2 text-sm text-gray-600">In stock only</span>
              </label>
            </div>

            <button className="w-full py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
              Apply Filters
            </button>
          </div>
        </div>

        {/* Products section */}
        <div className="flex-grow">
          {/* Sorting and view options */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <span className="text-sm text-gray-600 mr-2">Сортировать:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
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
                onClick={() => setViewMode('grid')}
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
                onClick={() => setViewMode('list')}
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
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading products...</p>
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
              filter={{
                category: activeCategory === 'all' 
                  ? undefined 
                  : categories.find(c => c.slug === activeCategory)?.name,
                subcategory: activeSubcategory
                  ? categories
                      .find(c => c.slug === activeCategory)
                      ?.subcategories?.find(s => s.slug === activeSubcategory)?.name
                  : undefined,
                minPrice: priceRange[0],
                maxPrice: priceRange[1],
              }}
              sorting={sortBy as any}
              layout={viewMode}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProductsContent />
    </Suspense>
  );
}
