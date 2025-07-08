'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ProductGrid from '@/components/product/ProductGrid';
import { FilterService } from '@/lib/services/filterService';
import { StandardizedFilterContainer } from '@/components/ProductFilters/StandardizedFilterContainer';
import { getProducts, getCategories } from '@/lib/supabase/db';
import { Product, Category } from '@/lib/supabase/types/types';
import { StandardFilter } from '@/lib/supabase/types/types';

export default function CategoryProductsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categorySlug = params.slug as string;

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<StandardFilter[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');

  // Инициализация фильтров из URL
  useEffect(() => {
    const urlFilters: Record<string, string[]> = {};

    // Парсим параметры из URL
    searchParams.forEach((value, key) => {
      if (key.startsWith('filter_')) {
        const filterName = key.replace('filter_', '');
        urlFilters[filterName] = value.split(',');
      }
    });

    setActiveFilters(urlFilters);
  }, [searchParams]);

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Параллельная загрузка данных
        const [productsData, categoriesData, filtersData] = await Promise.all([
          getProducts(),
          getCategories(),
          FilterService.getStandardFilters(categorySlug),
        ]);

        if (productsData.data) setProducts(productsData.data);
        if (categoriesData.data) {
          setCategories(categoriesData.data);
          const category = categoriesData.data.find(c => c.slug === categorySlug);
          if (category) setCategoryName(category.name);
        }

        setFilters(filtersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [categorySlug]);

  // Обновление URL при изменении фильтров
  const updateURL = (newFilters: Record<string, string[]>) => {
    const params = new URLSearchParams();

    Object.entries(newFilters).forEach(([key, values]) => {
      if (values.length > 0) {
        params.set(`filter_${key}`, values.join(','));
      }
    });

    params.set('sort', sortBy);
    params.set('view', viewMode);

    router.push(`/products/category/${categorySlug}?${params.toString()}`);
  };

  // Обработка изменения фильтров
  const handleFilterChange = (filterId: string, values: string[]) => {
    const newFilters = {
      ...activeFilters,
      [filterId]: values,
    };

    // Удаляем пустые фильтры
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key].length === 0) {
        delete newFilters[key];
      }
    });

    setActiveFilters(newFilters);
    updateURL(newFilters);
  };

  // Сброс всех фильтров
  const clearAllFilters = () => {
    setActiveFilters({});
    router.push(`/products/category/${categorySlug}?sort=${sortBy}&view=${viewMode}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{categoryName || 'Products'}</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Панель фильтров */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <StandardizedFilterContainer
              filters={filters}
              selectedFilters={activeFilters}
              onFilterChange={handleFilterChange}
              onClearAllFilters={clearAllFilters}
              categoryName={categoryName}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Основной контент */}
        <div className="flex-grow">
          {/* Сортировка и режим просмотра */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <span className="text-sm text-gray-600 mr-2">Сортировать:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="rounded-md border-gray-300 py-1 pl-3 pr-8 text-sm focus:ring-primary focus:border-primary"
              >
                <option value="newest">Новинки</option>
                <option value="price-asc">Цена: по возрастанию</option>
                <option value="price-desc">Цена: по убыванию</option>
                <option value="rating">Рейтинг</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

          {/* Сетка продуктов */}
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-500">Загрузка товаров...</p>
            </div>
          ) : (
            <ProductGrid
              products={products}
              title=""
              filter={activeFilters}
              sorting={sortBy as any}
              layout={viewMode}
            />
          )}
        </div>
      </div>
    </div>
  );
}
