import React, { useState, useMemo } from 'react';
import { PCBuilderCategory, PCBuilderProduct, SelectedComponent } from '@/types/pc-builder';
import { ProductCard } from './ProductCard';
import { ProductSpecificationsModal } from './ProductSpecificationsModal';
import { FilterPanel } from './filters/FilterPanel';
import { FilterService } from '@/lib/filters/FilterService';
import { CategoryFilterState } from '@/types/filters';

type SortOption = 'name' | 'rating' | 'price' | 'stock';
type SortDirection = 'asc' | 'desc';

interface CategoryBlockProps {
  category: PCBuilderCategory;
  availableProducts: PCBuilderProduct[];
  selectedComponent: SelectedComponent | null;
  isExpanded: boolean;
  isLoading: boolean;
  filterState: CategoryFilterState;
  onToggleExpand: (categorySlug: string) => void;
  onSelectProduct: (categorySlug: string, product: PCBuilderProduct) => void;
  onRemoveProduct: (categorySlug: string) => void;
  onFilterChange: (
    categorySlug: string,
    filterId: string,
    value:
      | string
      | string[]
      | { min: number | null; max: number | null }
      | boolean
      | null
      | 'all'
      | 'in_stock'
      | 'out_of_stock'
  ) => void;
  onClearAllFilters: (categorySlug: string) => void;
}

export const CategoryBlock: React.FC<CategoryBlockProps> = ({
  category,
  availableProducts,
  selectedComponent,
  isExpanded,
  isLoading,
  filterState,
  onToggleExpand,
  onSelectProduct,
  onRemoveProduct,
  onFilterChange,
  onClearAllFilters,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [modalProduct, setModalProduct] = useState<PCBuilderProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Apply filters first, then sort
  const filteredAndSortedProducts = useMemo(() => {
    // Apply filters
    const filterResult = FilterService.applyFilters(availableProducts, filterState.filters);
    const filteredProducts = filterResult.filteredProducts;

    // Then sort the filtered products
    const sorted = [...filteredProducts].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'stock':
          // Sort by stock status: in_stock first (true > false)
          comparison = a.in_stock === b.in_stock ? 0 : a.in_stock ? -1 : 1;
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [availableProducts, filterState.filters, sortBy, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredAndSortedProducts.slice(startIndex, endIndex);

  const handleToggleExpand = () => {
    onToggleExpand(category.slug);
  };

  const handleSelectProduct = (product: PCBuilderProduct) => {
    onSelectProduct(category.slug, product);
  };

  const handleRemoveProduct = () => {
    onRemoveProduct(category.slug);
  };

  const handleSortChange = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('asc');
    }
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  const handleShowSpecifications = (product: PCBuilderProduct) => {
    setModalProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalProduct(null);
  };

  return (
    <div
      className={`rounded-lg shadow-sm border border-gray-200 transition-all ${
        selectedComponent ? 'bg-blue-50 border-blue-200' : 'bg-white'
      } ${!isExpanded ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={!isExpanded ? handleToggleExpand : undefined}
    >
      {/* Category Header */}
      <div
        className={`p-4 border-b border-gray-100 ${isExpanded ? 'cursor-pointer' : ''}`}
        onClick={isExpanded ? handleToggleExpand : undefined}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Category Header */}
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">{category.displayName}</h3>
          </div>

          {/* Selected Product Summary */}
          {selectedComponent && (
            <div className="flex-1 flex justify-center">
              <div className="flex items-center gap-3">
                {/* Product Image */}
                <div className="w-12 h-12 flex-shrink-0">
                  <img
                    src={selectedComponent.product.main_image_url || '/placeholder-product.png'}
                    alt={selectedComponent.product.title}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
                {/* Product Info */}
                <div>
                  <p className="font-medium text-blue-900 text-sm">
                    {selectedComponent.product.title}
                  </p>
                  <p className="text-blue-700 text-sm">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                    }).format(selectedComponent.product.price)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Add/Expand Button and Remove Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={e => {
                e.stopPropagation();
                handleToggleExpand();
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
            >
              {selectedComponent ? 'Change' : 'Add'}
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {selectedComponent && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleRemoveProduct();
                }}
                className="flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                title="Remove"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading products...</span>
            </div>
          ) : (
            <>
              {/* Compact Filters - Always visible */}
              <FilterPanel
                filterState={filterState}
                onFilterChange={(filterId, value) => onFilterChange(category.slug, filterId, value)}
                onClearAllFilters={() => onClearAllFilters(category.slug)}
              />

              {paginatedProducts.length > 0 ? (
                <>
                  {/* Sorting Controls */}
                  <div className="mb-4 flex items-center gap-4 pb-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Sort by:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSortChange('name')}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          sortBy === 'name'
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        Name {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </button>
                      <button
                        onClick={() => handleSortChange('rating')}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          sortBy === 'rating'
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        Rating {sortBy === 'rating' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </button>
                      <button
                        onClick={() => handleSortChange('price')}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          sortBy === 'price'
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        Price {sortBy === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </button>
                      <button
                        onClick={() => handleSortChange('stock')}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          sortBy === 'stock'
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        In Stock {sortBy === 'stock' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </button>
                    </div>
                  </div>

                  {/* Vertical Product List */}
                  <div className="space-y-3">
                    {paginatedProducts.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        isSelected={selectedComponent?.product.id === product.id}
                        onSelect={handleSelectProduct}
                        onRemove={handleRemoveProduct}
                        onShowSpecifications={handleShowSpecifications}
                      />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                      <div className="text-sm text-gray-600">
                        Showing {startIndex + 1}-
                        {Math.min(endIndex, filteredAndSortedProducts.length)} of{' '}
                        {filteredAndSortedProducts.length} products
                        {filterState.activeFiltersCount > 0 && (
                          <span className="text-blue-600 ml-1">
                            (filtered from {availableProducts.length})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1 text-sm rounded-md ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg
                      className="w-12 h-12 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500">No products found</p>
                  {filterState.activeFiltersCount > 0 && (
                    <p className="text-sm text-blue-600 mt-2">
                      Try adjusting your filters above to see more results
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Product Specifications Modal */}
      <ProductSpecificationsModal
        product={modalProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};
