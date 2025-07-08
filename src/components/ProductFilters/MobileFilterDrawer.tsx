'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/utils';
import { Spinner } from '@/components/ui/Spinner';
import SpecificationFilters from '@/components/ProductFilters/SpecificationFilters';
import { Category } from '@/lib/supabase/types/types';

// Add custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
`;

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  query: string;
  updateFilters: (updates: Record<string, string | null>) => void;
  categories: Category[];
  isCategoriesLoading: boolean;
  categorySlug: string;
  subcategorySlug: string;
  handleCategoryChange: (category: string, subcategory?: string) => void;
  localPriceRange: [number, number];
  handlePriceChange: (min: number, max: number) => void;
  inStockOnly: boolean;
  handleInStockChange: (checked: boolean) => void;
  handleSpecFiltersChange: (filters: Record<string, any>) => void;
  applyPriceFilter: () => void;
}

export default function MobileFilterDrawer({
  isOpen,
  onClose,
  searchTerm,
  setSearchTerm,
  handleSearch,
  query,
  updateFilters,
  categories,
  isCategoriesLoading,
  categorySlug,
  subcategorySlug,
  handleCategoryChange,
  localPriceRange,
  handlePriceChange,
  inStockOnly,
  handleInStockChange,
  handleSpecFiltersChange,
  applyPriceFilter,
}: MobileFilterDrawerProps) {
  // State to track which filter sections are collapsed
  const [collapsedSections, setCollapsedSections] = useState({
    search: false,
    categories: false,
    price: false,
    stock: false,
  });

  // Toggle function for filter sections
  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="relative w-screen max-w-md">
          <div className="h-full flex flex-col bg-white shadow-xl">
            <style jsx global>
              {scrollbarStyles}
            </style>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Scrollable container for filters */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4">
              {/* Search */}
              <div className="mb-6 border-b border-gray-100 pb-2">
                <div
                  className="flex items-center justify-between cursor-pointer py-2"
                  onClick={() => toggleSection('search')}
                >
                  <h3 className="font-medium text-gray-800">Search</h3>
                  <span
                    className="text-gray-500 transition-transform duration-200"
                    style={{
                      transform: collapsedSections.search ? 'rotate(0deg)' : 'rotate(180deg)',
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </div>

                <div
                  className={`mt-2 transition-all duration-300 ${
                    collapsedSections.search ? 'h-0 overflow-hidden opacity-0' : 'opacity-100'
                  }`}
                >
                  <form onSubmit={handleSearch} className="flex items-center">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search products..."
                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <button
                        type="submit"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary"
                      >
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
                        onClick={() => updateFilters({ q: null })}
                        className="text-xs text-primary hover:text-primary/80"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6 border-b border-gray-100 pb-2">
                <div
                  className="flex items-center justify-between cursor-pointer py-2"
                  onClick={() => toggleSection('categories')}
                >
                  <h3 className="font-medium text-gray-800">Categories</h3>
                  <span
                    className="text-gray-500 transition-transform duration-200"
                    style={{
                      transform: collapsedSections.categories ? 'rotate(0deg)' : 'rotate(180deg)',
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </div>

                <div
                  className={`mt-2 transition-all duration-300 ${
                    collapsedSections.categories ? 'h-0 overflow-hidden opacity-0' : 'opacity-100'
                  }`}
                >
                  {isCategoriesLoading ? (
                    <div className="py-2">
                      <Spinner
                        size="small"
                        color="primary"
                        text="Loading categories..."
                        centered={false}
                      />
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      <li>
                        <button
                          className={cn(
                            'w-full text-left py-1 px-2 rounded-md text-sm transition-colors',
                            categorySlug === 'all'
                              ? 'bg-primary/10 text-primary'
                              : 'text-gray-600 hover:bg-gray-100'
                          )}
                          onClick={() => {
                            handleCategoryChange('all');
                            onClose();
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
                              categorySlug === category.slug && !subcategorySlug
                                ? 'bg-primary/10 text-primary'
                                : 'text-gray-600 hover:bg-gray-100'
                            )}
                            onClick={() => {
                              handleCategoryChange(category.slug);
                              onClose();
                            }}
                          >
                            {category.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Price range */}
              <div className="mb-6 border-b border-gray-100 pb-2">
                <div
                  className="flex items-center justify-between cursor-pointer py-2"
                  onClick={() => toggleSection('price')}
                >
                  <h3 className="font-medium text-gray-800">Price</h3>
                  <span
                    className="text-gray-500 transition-transform duration-200"
                    style={{
                      transform: collapsedSections.price ? 'rotate(0deg)' : 'rotate(180deg)',
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </div>

                <div
                  className={`mt-2 transition-all duration-300 ${
                    collapsedSections.price ? 'h-0 overflow-hidden opacity-0' : 'opacity-100'
                  }`}
                >
                  <div className="px-2">
                    {/* Price range slider */}
                    <div className="relative pt-6 pb-2">
                      {/* State for tracking dragging */}
                      {(() => {
                        const [isDraggingMin, setIsDraggingMin] = useState(false);
                        const [isDraggingMax, setIsDraggingMax] = useState(false);

                        // Calculate percentage positions for slider handles
                        const minPercent = (localPriceRange[0] / 2000) * 100;
                        const maxPercent = (localPriceRange[1] / 2000) * 100;

                        // Handle mouse/touch events for slider
                        const handleSliderMouseDown = (
                          event: React.MouseEvent | React.TouchEvent,
                          isMin: boolean
                        ) => {
                          event.preventDefault();
                          if (isMin) {
                            setIsDraggingMin(true);
                          } else {
                            setIsDraggingMax(true);
                          }
                        };

                        // Handle slider track click
                        const handleTrackClick = (event: React.MouseEvent) => {
                          if (isDraggingMin || isDraggingMax) return;

                          const trackRect = (
                            event.currentTarget as HTMLElement
                          ).getBoundingClientRect();
                          const clickPosition = event.clientX - trackRect.left;
                          const trackWidth = trackRect.width;
                          const clickPercent = (clickPosition / trackWidth) * 100;

                          // Calculate value based on click position
                          const value = Math.round((2000 * clickPercent) / 100);

                          // Determine which handle to move based on proximity
                          const distToMin = Math.abs(clickPercent - minPercent);
                          const distToMax = Math.abs(clickPercent - maxPercent);

                          if (distToMin <= distToMax) {
                            // Move min handle
                            handlePriceChange(
                              Math.min(value, localPriceRange[1]),
                              localPriceRange[1]
                            );
                          } else {
                            // Move max handle
                            handlePriceChange(
                              localPriceRange[0],
                              Math.max(value, localPriceRange[0])
                            );
                          }
                        };

                        // Handle mouse/touch move during drag
                        useEffect(() => {
                          const handleMouseMove = (event: MouseEvent | TouchEvent) => {
                            if (!isDraggingMin && !isDraggingMax) return;

                            // Get the slider track element
                            const sliderTrack = document.getElementById(
                              'mobile-price-slider-track'
                            );
                            if (!sliderTrack) return;

                            const trackRect = sliderTrack.getBoundingClientRect();
                            const trackWidth = trackRect.width;

                            // Get mouse/touch position
                            let clientX: number;
                            if ('touches' in event) {
                              clientX = event.touches[0].clientX;
                            } else {
                              clientX = event.clientX;
                            }

                            // Calculate position relative to track
                            let position = clientX - trackRect.left;
                            position = Math.max(0, Math.min(position, trackWidth));

                            // Convert position to value
                            const positionPercent = (position / trackWidth) * 100;
                            const value = Math.round((2000 * positionPercent) / 100);

                            // Update the appropriate handle
                            if (isDraggingMin) {
                              // Ensure min doesn't exceed max
                              const newMin = Math.min(value, localPriceRange[1]);
                              handlePriceChange(newMin, localPriceRange[1]);
                            } else if (isDraggingMax) {
                              // Ensure max doesn't go below min
                              const newMax = Math.max(value, localPriceRange[0]);
                              handlePriceChange(localPriceRange[0], newMax);
                            }
                          };

                          const handleMouseUp = () => {
                            setIsDraggingMin(false);
                            setIsDraggingMax(false);
                          };

                          // Add event listeners when dragging
                          if (isDraggingMin || isDraggingMax) {
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('touchmove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                            document.addEventListener('touchend', handleMouseUp);
                          }

                          // Clean up event listeners
                          return () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('touchmove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                            document.removeEventListener('touchend', handleMouseUp);
                          };
                        }, [isDraggingMin, isDraggingMax, localPriceRange]);

                        return (
                          <>
                            <div
                              id="mobile-price-slider-track"
                              className="absolute left-0 right-0 h-2 bg-gray-200 rounded-lg top-6 cursor-pointer"
                              onClick={handleTrackClick}
                            ></div>
                            <div
                              className="absolute h-2 bg-primary/70 rounded-lg top-6"
                              style={{
                                left: `${minPercent}%`,
                                right: `${100 - maxPercent}%`,
                              }}
                            ></div>

                            {/* Min handle */}
                            <div
                              className={`absolute w-5 h-5 bg-white border-2 border-primary rounded-full -mt-1.5 cursor-grab shadow-md transition-transform ${isDraggingMin ? 'cursor-grabbing scale-110' : 'hover:scale-110'}`}
                              style={{ left: `${minPercent}%`, marginLeft: '-10px' }}
                              onMouseDown={e => handleSliderMouseDown(e, true)}
                              onTouchStart={e => handleSliderMouseDown(e, true)}
                              role="slider"
                              aria-valuemin={0}
                              aria-valuemax={2000}
                              aria-valuenow={localPriceRange[0]}
                              aria-label="Minimum price"
                              tabIndex={0}
                            ></div>

                            {/* Max handle */}
                            <div
                              className={`absolute w-5 h-5 bg-white border-2 border-primary rounded-full -mt-1.5 cursor-grab shadow-md transition-transform ${isDraggingMax ? 'cursor-grabbing scale-110' : 'hover:scale-110'}`}
                              style={{ left: `${maxPercent}%`, marginLeft: '-10px' }}
                              onMouseDown={e => handleSliderMouseDown(e, false)}
                              onTouchStart={e => handleSliderMouseDown(e, false)}
                              role="slider"
                              aria-valuemin={0}
                              aria-valuemax={2000}
                              aria-valuenow={localPriceRange[1]}
                              aria-label="Maximum price"
                              tabIndex={0}
                            ></div>

                            {/* Price labels */}
                            <div className="flex justify-between mt-4 text-xs text-gray-500">
                              <span>${localPriceRange[0]}</span>
                              <span>${localPriceRange[1]}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Manual input fields */}
                    <div className="flex flex-col space-y-3 mt-4">
                      <div className="relative w-full">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={localPriceRange[1]}
                          value={localPriceRange[0]}
                          onChange={e => {
                            const newMin = Number(e.target.value);
                            // Get the current max value to preserve it
                            const currentMax = localPriceRange[1];
                            if (!isNaN(newMin) && newMin >= 0 && newMin <= currentMax) {
                              handlePriceChange(newMin, currentMax);
                            }
                          }}
                          className="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/70"
                          placeholder="Min price"
                        />
                      </div>
                      <div className="relative w-full">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          min={localPriceRange[0]}
                          max={2000}
                          value={localPriceRange[1]}
                          onChange={e => {
                            const newMax = Number(e.target.value);
                            // Get the current min value to preserve it
                            const currentMin = localPriceRange[0];
                            if (!isNaN(newMax) && newMax >= currentMin && newMax <= 2000) {
                              handlePriceChange(currentMin, newMax);
                            }
                          }}
                          className="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/70"
                          placeholder="Max price"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* In stock only */}
              <div className="mb-6 border-b border-gray-100 pb-2">
                <div
                  className="flex items-center justify-between cursor-pointer py-2"
                  onClick={() => toggleSection('stock')}
                >
                  <h3 className="font-medium text-gray-800">Availability</h3>
                  <span
                    className="text-gray-500 transition-transform duration-200"
                    style={{
                      transform: collapsedSections.stock ? 'rotate(0deg)' : 'rotate(180deg)',
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </div>

                <div
                  className={`mt-2 transition-all duration-300 ${
                    collapsedSections.stock ? 'h-0 overflow-hidden opacity-0' : 'opacity-100'
                  }`}
                >
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={e => handleInStockChange(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-gray-600">In stock only</span>
                  </label>
                </div>
              </div>

              {/* Specification filters */}
              {categorySlug !== 'all' && (
                <div className="mb-6">
                  <SpecificationFilters
                    categorySlug={categorySlug}
                    onFiltersChange={handleSpecFiltersChange}
                    className="p-0 border-0 shadow-none"
                  />
                </div>
              )}
            </div>

            <div className="border-t p-4">
              <button
                onClick={() => {
                  applyPriceFilter();
                  onClose();
                }}
                className="w-full py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
