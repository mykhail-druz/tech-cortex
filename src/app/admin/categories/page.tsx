'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import * as dbService from '@/lib/supabase/db';
import * as adminDbService from '@/lib/supabase/adminDb';
import * as storageService from '@/lib/supabase/storageService';
import { Category } from '@/lib/supabase/types';

export default function CategoriesPage() {
  // const { user } = useAuth(); // Commented out as it's not being used
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await dbService.getCategories();
        if (data) {
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'name') {
      // Auto-generate slug when name changes
      setFormData({
        ...formData,
        name: value,
        slug: generateSlug(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast.warning('Please select an image file (JPEG, PNG, etc.)');
        return;
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('Image size should be less than 5MB');
        return;
      }

      setSelectedImage(file);

      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.slug.trim()) errors.slug = 'Slug is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open add category modal
  const openAddModal = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
    });
    setFormErrors({});
    setSelectedImage(null);
    setImagePreview(null);
    setShowAddModal(true);
  };

  // Open edit category modal
  const openEditModal = (category: Category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
    });
    setFormErrors({});
    setSelectedImage(null);
    setImagePreview(null);
    setShowEditModal(true);
  };

  // Open delete category modal
  const openDeleteModal = (category: Category) => {
    setCurrentCategory(category);
    setShowDeleteModal(true);
  };

  // Add new category
  const addCategory = async () => {
    if (!validateForm()) return;

    try {
      const categoryData = { ...formData };

      // Upload image if selected
      if (selectedImage) {
        setUploadingImage(true);

        // Upload to Supabase storage
        const { url, error } = await storageService.uploadFile(
          selectedImage,
          'categories', // bucket name
          'images' // folder path
        );

        if (error) {
          throw error;
        }

        if (url) {
          // Update category data with the image URL
          categoryData.image_url = url;
        }

        setUploadingImage(false);
      }

      // Create category with updated data
      const { data, error } = await adminDbService.createCategory(categoryData);

      if (error) {
        console.error('Error creating category:', error);
        return;
      }

      if (data) {
        setCategories((prev) => [...prev, data]);
        setShowAddModal(false);

        // Reset image state
        setSelectedImage(null);
        setImagePreview(null);
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Update category
  const updateCategory = async () => {
    if (!currentCategory || !validateForm()) return;

    try {
      const categoryData = { ...formData };

      // Upload image if selected
      if (selectedImage) {
        setUploadingImage(true);

        // Upload to Supabase storage
        const { url, error } = await storageService.uploadFile(
          selectedImage,
          'categories', // bucket name
          'images' // folder path
        );

        if (error) {
          throw error;
        }

        if (url) {
          // Update category data with the image URL
          categoryData.image_url = url;
        }

        setUploadingImage(false);
      }

      // Update category with updated data
      const { data, error } = await adminDbService.updateCategory(currentCategory.id, categoryData);

      if (error) {
        console.error('Error updating category:', error);
        return;
      }

      if (data) {
        setCategories((prev) => 
          prev.map((c) => (c.id === data.id ? data : c))
        );
        setShowEditModal(false);

        // Reset image state
        setSelectedImage(null);
        setImagePreview(null);
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Delete category
  const deleteCategory = async () => {
    if (!currentCategory) return;

    try {
      const { error } = await adminDbService.deleteCategory(currentCategory.id);

      if (error) {
        console.error('Error deleting category:', error);
        return;
      }

      setCategories((prev) => prev.filter((c) => c.id !== currentCategory.id));
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button
          onClick={openAddModal}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add New Category
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.length > 0 ? (
              categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {category.image_url && (
                        <div className="flex-shrink-0 h-10 w-10 mr-4">
                          <div className="relative h-10 w-10 rounded-full overflow-hidden">
                            <Image
                              className="object-cover"
                              src={category.image_url}
                              alt={category.name}
                              fill
                              sizes="40px"
                            />
                          </div>
                        </div>
                      )}
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.slug}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {category.description || 'No description'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(category)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(category)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No categories found. Add your first category to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Add New Category</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name*
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  formErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug*
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  formErrors.slug ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.slug && (
                <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded"
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Image
              </label>
              <div className="flex flex-col space-y-2">
                <input
                  type="file"
                  id="category_image"
                  name="category_image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />

                {/* Image preview */}
                {imagePreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Preview:</p>
                    <div className="relative w-40 h-40 border border-gray-300 rounded-md overflow-hidden">
                      <Image 
                        src={imagePreview} 
                        alt="Preview" 
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Current image URL input (hidden but still part of form data) */}
                <input
                  type="hidden"
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                />

                {/* Show URL if exists but no preview */}
                {!imagePreview && formData.image_url && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Current image URL:</p>
                    <p className="text-sm text-blue-500 truncate">{formData.image_url}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addCategory}
                disabled={uploadingImage}
                className="px-4 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 disabled:bg-blue-400"
              >
                {uploadingImage ? 'Uploading...' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && currentCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Edit Category</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name*
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  formErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug*
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  formErrors.slug ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.slug && (
                <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded"
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Image
              </label>
              <div className="flex flex-col space-y-2">
                <input
                  type="file"
                  id="edit_category_image"
                  name="edit_category_image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />

                {/* Image preview */}
                {imagePreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Preview:</p>
                    <div className="relative w-40 h-40 border border-gray-300 rounded-md overflow-hidden">
                      <Image 
                        src={imagePreview} 
                        alt="Preview" 
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Current image URL input (hidden but still part of form data) */}
                <input
                  type="hidden"
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                />

                {/* Show current image if exists */}
                {!imagePreview && formData.image_url && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Current image:</p>
                    <div className="relative w-40 h-40 border border-gray-300 rounded-md overflow-hidden">
                      <Image 
                        src={formData.image_url} 
                        alt={formData.name} 
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={updateCategory}
                disabled={uploadingImage}
                className="px-4 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 disabled:bg-blue-400"
              >
                {uploadingImage ? 'Uploading...' : 'Update Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-4">
              Are you sure you want to delete the category &quot;{currentCategory.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={deleteCategory}
                className="px-4 py-2 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
