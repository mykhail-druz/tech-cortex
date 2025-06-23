'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCompare } from '@/contexts/CompareContext';
import { cn } from '@/lib/utils/utils';
import { useRouter } from 'next/navigation';

export default function ComparePage() {
  const {
    items,
    removeItem,
    clearCompareList,
    isLoading,
    currentCategory,
    categoryName,
    setViewCategory,
    getAvailableCategories,
  } = useCompare();
  const router = useRouter();
  // We no longer need to track selected specs as all specs are always visible
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(currentCategory);

  // Update selectedCategoryId when currentCategory changes (for automatic selection)
  useEffect(() => {
    setSelectedCategoryId(currentCategory);
  }, [currentCategory]);

  // Handle category change
  const handleCategoryChange = async (categoryId: string) => {
    await setViewCategory(categoryId);
    setSelectedCategoryId(categoryId);
  };

  // Get available categories
  const availableCategories = getAvailableCategories();

  // Filter items by selected category
  const filteredItems = selectedCategoryId
    ? items.filter(item => item.product.category_id === selectedCategoryId)
    : items;

  // Get all unique specification names across all products, grouped by template
  const getAllSpecNames = () => {
    const specMap = new Map<
      string,
      { name: string; displayName: string; templateId: string | null }
    >();

    filteredItems.forEach(item => {
      item.product.specifications?.forEach(spec => {
        // If the spec has a template, use the template's display_name as the key
        if (spec.template) {
          const key = spec.template.id;
          if (!specMap.has(key)) {
            specMap.set(key, {
              name: spec.template.name,
              displayName: spec.template.display_name,
              templateId: spec.template.id,
            });
          }
        } else {
          // For specs without templates, use the spec name as the key
          const key = spec.name;
          if (!specMap.has(key)) {
            specMap.set(key, {
              name: spec.name,
              displayName: spec.name,
              templateId: null,
            });
          }
        }
      });
    });

    // Convert map to array and sort by display name
    return Array.from(specMap.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
  };

  // Format price with currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Render the product rating stars
  const renderRating = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg
          key={i}
          className={`h-4 w-4 ${i <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    return stars;
  };

  // Get specification value for a product
  const getSpecValue = (
    productId: string,
    specInfo: { name: string; templateId: string | null }
  ) => {
    const product = items.find(item => item.product.id === productId)?.product;
    if (!product || !product.specifications) return 'N/A';

    let spec;
    if (specInfo.templateId) {
      // If we have a template ID, find the spec with that template
      spec = product.specifications.find(s => s.template?.id === specInfo.templateId);
    } else {
      // Otherwise, fall back to matching by name
      spec = product.specifications.find(s => s.name === specInfo.name);
    }

    return spec ? spec.value : 'N/A';
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading comparison...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no products to compare
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Comparison</h1>
          <p className="text-gray-600 mb-6">You haven't added any products to compare yet.</p>
          <button
            onClick={() => router.push('/products')}
            className="px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary-dark transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  // Show message if no products in selected category
  if (filteredItems.length === 0 && selectedCategoryId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Product Comparison</h1>
          <p className="text-gray-600 mb-6">
            No products in the selected category. Please select a different category or add more
            products.
          </p>

          {/* Category selector */}
          {availableCategories.length > 0 && (
            <div className="relative mb-4">
              <select
                value={selectedCategoryId || ''}
                onChange={e => handleCategoryChange(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-4 pr-10 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="" disabled>
                  Select category
                </option>
                {availableCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => router.push('/products')}
              className="px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary-dark transition-colors"
            >
              Add More Products
            </button>
            <button
              onClick={() => setViewCategory(null)}
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              View All Categories
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get all unique specification names
  const allSpecNames = getAllSpecNames();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Product Comparison</h1>
          {categoryName && (
            <p className="text-gray-600">
              Comparing products in <span className="font-medium text-primary">{categoryName}</span>{' '}
              category
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
          {/* Category selector */}
          {availableCategories.length > 0 && (
            <div className="relative">
              <select
                value={selectedCategoryId || ''}
                onChange={e => handleCategoryChange(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-4 pr-10 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="" disabled>
                  Select category
                </option>
                {availableCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}
          <button
            onClick={() => router.push('/products')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Add More Products
          </button>
          <button
            onClick={() => clearCompareList()}
            className="px-4 py-2 border border-red-500 rounded-md text-red-500 font-medium hover:bg-red-50 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Comparison table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="p-4 text-left text-gray-600 font-medium w-1/5">Product</th>
              {filteredItems.map(item => (
                <th
                  key={item.product.id}
                  className="p-4 text-center"
                  style={{ width: `${80 / filteredItems.length}%` }}
                >
                  <div className="relative">
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      aria-label="Remove from comparison"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Product image and name */}
            <tr className="border-b border-gray-200">
              <td className="p-4 text-gray-600 font-medium">Image</td>
              {filteredItems.map(item => (
                <td key={item.product.id} className="p-4 text-center">
                  <Link href={`/products/${item.product.slug}`} className="block mx-auto">
                    <div
                      className="relative h-40 mx-auto"
                      style={{ width: '160px', aspectRatio: '1/1' }}
                    >
                      <Image
                        src={item.product.main_image_url || '/placeholder-product.jpg'}
                        alt={item.product.title}
                        fill
                        sizes="160px"
                        className="object-contain"
                      />
                    </div>
                  </Link>
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-200">
              <td className="p-4 text-gray-600 font-medium">Name</td>
              {filteredItems.map(item => (
                <td key={item.product.id} className="p-4 text-center">
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="font-medium text-gray-900 hover:text-primary"
                  >
                    {item.product.title}
                  </Link>
                </td>
              ))}
            </tr>

            {/* Price */}
            <tr className="border-b border-gray-200">
              <td className="p-4 text-gray-600 font-medium">Price</td>
              {filteredItems.map(item => (
                <td key={item.product.id} className="p-4 text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-semibold text-gray-900">
                      {formatPrice(item.product.price)}
                    </span>
                    {item.product.old_price > 0 && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(item.product.old_price)}
                      </span>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Rating */}
            <tr className="border-b border-gray-200">
              <td className="p-4 text-gray-600 font-medium">Rating</td>
              {filteredItems.map(item => (
                <td key={item.product.id} className="p-4 text-center">
                  <div className="flex justify-center items-center">
                    <div className="flex mr-2">{renderRating(item.product.rating || 0)}</div>
                    <span className="text-gray-600 text-sm">
                      ({item.product.review_count || 0})
                    </span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Brand */}
            <tr className="border-b border-gray-200">
              <td className="p-4 text-gray-600 font-medium">Brand</td>
              {filteredItems.map(item => (
                <td key={item.product.id} className="p-4 text-center">
                  {item.product.brand || 'N/A'}
                </td>
              ))}
            </tr>

            {/* Availability */}
            <tr className="border-b border-gray-200">
              <td className="p-4 text-gray-600 font-medium">Availability</td>
              {filteredItems.map(item => (
                <td key={item.product.id} className="p-4 text-center">
                  {item.product.in_stock ? (
                    <span className="text-green-600 font-medium">In Stock</span>
                  ) : (
                    <span className="text-red-600 font-medium">Out of Stock</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Description */}
            <tr className="border-b border-gray-200">
              <td className="p-4 text-gray-600 font-medium">Description</td>
              {filteredItems.map(item => (
                <td key={item.product.id} className="p-4 text-center">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {item.product.description || 'No description available'}
                  </p>
                </td>
              ))}
            </tr>

            {/* Specifications heading */}
            <tr className="bg-gray-50">
              <td colSpan={items.length + 1} className="p-4 text-gray-900 font-semibold">
                Specifications
              </td>
            </tr>

            {/* Specifications */}
            {allSpecNames.map(spec => {
              const specId = spec.templateId || spec.name;
              return (
                <tr key={specId} className="border-b border-gray-200">
                  <td className="p-4 text-gray-600 font-medium">{spec.displayName}</td>
                  {filteredItems.map(item => (
                    <td key={`${item.product.id}-${specId}`} className="p-4 text-center">
                      {getSpecValue(item.product.id, spec)}
                    </td>
                  ))}
                </tr>
              );
            })}

            {/* Actions */}
            <tr>
              <td className="p-4 text-gray-600 font-medium">Actions</td>
              {filteredItems.map(item => (
                <td key={item.product.id} className="p-4 text-center">
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-dark transition-colors text-center"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
