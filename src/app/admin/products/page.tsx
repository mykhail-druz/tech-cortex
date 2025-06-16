'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import * as dbService from '@/lib/supabase/db';
import { Product, Category } from '@/lib/supabase/types/types';
import Link from 'next/link';

// Product Management Page
export default function ProductsManagement() {
  const { user } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products and categories
        const [productsResponse, categoriesResponse] = await Promise.all([
          dbService.getProducts(),
          dbService.getCategories(),
        ]);

        if (productsResponse.data) {
          setProducts(productsResponse.data);
        }

        if (categoriesResponse.data) {
          setCategories(categoriesResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // Filter products based on search term and selected category/subcategory
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory ? product.category_id === selectedCategory : true;

    // Add subcategory filter
    const matchesSubcategory = selectedSubcategory
      ? product.subcategory_id === selectedSubcategory
      : true;

    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  // Function to get category and subcategory name
  const getCategoryName = (categoryId: string | null, subcategoryId: string | null) => {
    if (!categoryId && !subcategoryId) return 'Uncategorized';

    let result = '';

    if (categoryId) {
      const category = categories.find(cat => cat.id === categoryId);
      result = category ? category.name : 'Unknown';
    }

    if (subcategoryId) {
      // Find the subcategory
      let subcategory = null;
      for (const cat of categories) {
        if (cat.subcategories) {
          subcategory = cat.subcategories.find(sub => sub.id === subcategoryId);
          if (subcategory) break;
        }
      }

      if (subcategory) {
        result += result ? ` › ${subcategory.name}` : subcategory.name;
      }
    }

    return result || 'Uncategorized';
  };

  // Function to open delete confirmation modal
  const handleDeleteProduct = (product: Product) => {
    setCurrentProduct(product);
    setShowDeleteModal(true);
  };

  // Function to actually delete the product
  const deleteProduct = async () => {
    if (!currentProduct) return;

    try {
      setDeletingProduct(true);

      // Use the admin database service to delete the product
      const { error } = await import('@/lib/supabase/adminDb').then(module =>
        module.deleteProduct(currentProduct.id)
      );

      if (error) {
        throw error;
      }

      // Remove it from the state
      setProducts(products.filter(product => product.id !== currentProduct.id));
      setShowDeleteModal(false);
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setDeletingProduct(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Products Management</h1>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-full sm:w-auto text-center"
        >
          Add New Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search Products
            </label>
            <input
              type="text"
              id="search"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category filter */}
            <div className="space-y-2">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Filter by Category
              </label>
              <select
                id="category"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={selectedCategory}
                onChange={e => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategory(''); // Reset subcategory when category changes
                }}
              >
                <option value="">All Categories</option>
                {categories
                  .filter(c => !c.is_subcategory)
                  .map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Subcategory filter - only show when a category is selected */}
            {selectedCategory && (
              <div className="space-y-2">
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">
                  Filter by Subcategory
                </label>
                <select
                  id="subcategory"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={selectedSubcategory}
                  onChange={e => setSelectedSubcategory(e.target.value)}
                >
                  <option value="">All Subcategories</option>
                  {categories
                    .find(c => c.id === selectedCategory)
                    ?.subcategories?.map(subcategory => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <tr key={product.id}>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center">
                        {product.main_image_url && (
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-md object-cover"
                              src={product.main_image_url}
                              alt={product.title}
                            />
                          </div>
                        )}
                        <div className="ml-2 sm:ml-4">
                          <div className="text-sm font-medium text-gray-900 line-clamp-1">
                            {product.title}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 hidden xs:block">
                            SKU: {product.sku || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 text-sm text-gray-500">
                      {getCategoryName(product.category_id, product.subcategory_id)}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="text-sm text-gray-900">${product.price.toFixed(2)}</div>
                      {product.old_price && product.old_price > 0 && (
                        <div className="text-xs sm:text-sm text-gray-500 line-through">
                          ${product.old_price.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <span
                        className={`px-4 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-nowrap ${
                          product.in_stock
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.in_stock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium">
                      <div className="flex flex-col xs:flex-row gap-2 xs:space-x-2">
                        <Link
                          href={`/admin/products/edit/${product.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                        <Link
                          href={`/products/${product.slug}`}
                          target="_blank"
                          className="text-gray-600 hover:text-gray-900"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 sm:px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm || selectedCategory
                      ? 'No products match your search criteria'
                      : 'No products found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-4">
              Are you sure you want to delete the product &quot;{currentProduct.title}&quot;? This
              action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={deletingProduct}
              >
                Cancel
              </button>
              <button
                onClick={deleteProduct}
                className="px-4 py-2 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600 flex items-center"
                disabled={deletingProduct}
              >
                {deletingProduct ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
