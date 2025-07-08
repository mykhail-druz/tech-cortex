'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import * as dbService from '@/lib/supabase/db';
import * as adminDbService from '@/lib/supabase/adminDb';
import * as storageService from '@/lib/supabase/storageService';
import { Category, CategorySpecificationTemplate } from '@/lib/supabase/types/types';

export default function CategoriesPage() {
  // const { user } = useAuth(); // Commented out as it's not being used
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    icon_url: '',
    is_subcategory: false,
    parent_id: '',
    pc_component_type: '',
    pc_required: false,
    pc_supports_multiple: false,
    pc_display_order: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Specification templates state
  const [specTemplates, setSpecTemplates] = useState<CategorySpecificationTemplate[]>([]);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    display_name: '',
    description: '',
    is_required: false,
    data_type: 'text',
  });
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateFormErrors, setTemplateFormErrors] = useState<Record<string, string>>({});

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await dbService.getAllCategories();
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      reader.onload = event => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle icon file selection
  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast.warning('Please select an image file (JPEG, PNG, etc.)');
        return;
      }

      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.warning('Icon size should be less than 2MB');
        return;
      }

      setSelectedIcon(file);

      // Create a preview URL for the selected icon
      const reader = new FileReader();
      reader.onload = event => {
        setIconPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.slug.trim()) errors.slug = 'Slug is required';
    if (formData.is_subcategory && !formData.parent_id) {
      errors.parent_id = 'Parent category is required for subcategories';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add a function to get main categories (for parent selection)
  const getMainCategories = () => {
    return categories.filter(cat => !cat.is_subcategory);
  };

  // Open add category modal
  const openAddModal = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      icon_url: '',
      is_subcategory: false,
      parent_id: '',
      pc_component_type: '',
      pc_required: false,
      pc_supports_multiple: false,
      pc_display_order: 0,
    });
    setFormErrors({});
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedIcon(null);
    setIconPreview(null);
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
      icon_url: category.icon_url || '',
      is_subcategory: category.is_subcategory || false,
      parent_id: category.parent_id || '',
      pc_component_type: category.pc_component_type || '',
      pc_required: category.pc_required || false,
      pc_supports_multiple: category.pc_supports_multiple || false,
      pc_display_order: category.pc_display_order || 0,
    });
    setFormErrors({});
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedIcon(null);
    setIconPreview(null);
    setShowEditModal(true);
  };

  // Open delete category modal
  const openDeleteModal = (category: Category) => {
    setCurrentCategory(category);
    setShowDeleteModal(true);
  };

  // Open specification templates modal
  const openTemplatesModal = async (category: Category) => {
    // Check if the category is a root category
    if (category.is_subcategory) {
      toast.error('Specification templates can only be created for root categories');
      return;
    }

    setCurrentCategory(category);
    setLoadingTemplates(true);
    setShowTemplatesModal(true);

    try {
      const { data, error } = await adminDbService.getCategorySpecificationTemplates(category.id);

      if (error) {
        throw error;
      }

      if (data) {
        setSpecTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching specification templates:', error);
      toast.error('Failed to load specification templates');
    } finally {
      setLoadingTemplates(false);
    }

    // Reset template form
    setNewTemplate({
      name: '',
      display_name: '',
      description: '',
      is_required: false,
      data_type: 'text',
    });
    setEditingTemplateId(null);
    setTemplateFormErrors({});
  };

  // Handle template form input changes
  const handleTemplateInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewTemplate(prev => ({ ...prev, [name]: value }));
  };

  // Handle template checkbox changes
  const handleTemplateCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNewTemplate(prev => ({ ...prev, [name]: checked }));
  };

  // Validate template form
  const validateTemplateForm = () => {
    const errors: Record<string, string> = {};

    if (!newTemplate.name.trim()) errors.name = 'Name is required';
    if (!newTemplate.display_name.trim()) errors.display_name = 'Display name is required';

    setTemplateFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add a new template
  const addTemplate = async () => {
    if (!currentCategory || !validateTemplateForm()) return;

    try {
      const templateData = {
        ...newTemplate,
        category_id: currentCategory.id,
        display_order: specTemplates.length,
      };

      const { data, error } = await adminDbService.createCategorySpecificationTemplate(templateData);

      if (error) {
        throw error;
      }

      if (data) {
        setSpecTemplates(prev => [...prev, data]);
        setNewTemplate({
          name: '',
          display_name: '',
          description: '',
          is_required: false,
          data_type: 'text',
        });
        toast.success('Specification template added successfully');
      }
    } catch (error) {
      console.error('Error adding specification template:', error);
      toast.error('Failed to add specification template');
    }
  };

  // Start editing a template
  const startEditingTemplate = (template: CategorySpecificationTemplate) => {
    setEditingTemplateId(template.id);
    setNewTemplate({
      name: template.name,
      display_name: template.display_name,
      description: template.description || '',
      is_required: template.is_required,
      data_type: template.data_type,
    });
  };

  // Cancel editing a template
  const cancelEditingTemplate = () => {
    setEditingTemplateId(null);
    setNewTemplate({
      name: '',
      display_name: '',
      description: '',
      is_required: false,
      data_type: 'text',
    });
    setTemplateFormErrors({});
  };

  // Update a template
  const updateTemplate = async () => {
    if (!editingTemplateId || !validateTemplateForm()) return;

    try {
      const templateData = {
        ...newTemplate,
      };

      const { data, error } = await adminDbService.updateCategorySpecificationTemplate(
        editingTemplateId,
        templateData
      );

      if (error) {
        throw error;
      }

      if (data) {
        setSpecTemplates(prev => 
          prev.map(template => (template.id === editingTemplateId ? data : template))
        );
        setEditingTemplateId(null);
        setNewTemplate({
          name: '',
          display_name: '',
          description: '',
          is_required: false,
          data_type: 'text',
        });
        toast.success('Specification template updated successfully');
      }
    } catch (error) {
      console.error('Error updating specification template:', error);
      toast.error('Failed to update specification template');
    }
  };

  // Delete a template
  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await adminDbService.deleteCategorySpecificationTemplate(id);

      if (error) {
        throw error;
      }

      setSpecTemplates(prev => prev.filter(template => template.id !== id));
      toast.success('Specification template deleted successfully');
    } catch (error) {
      console.error('Error deleting specification template:', error);
      toast.error('Failed to delete specification template');
    }
  };

  // Add the new category
  const addCategory = async () => {
    if (!validateForm()) return;

    try {
      const categoryData = { ...formData };

      // Convert empty parent_id to null to avoid UUID type error
      if (categoryData.parent_id === '') {
        categoryData.parent_id = null;
      }

      setUploadingImage(true);

      // Upload main image if selected
      if (selectedImage) {
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
      }

      // Upload icon if selected
      if (selectedIcon) {
        // Upload to Supabase storage
        const { url, error } = await storageService.uploadFile(
          selectedIcon,
          'categories', // bucket name
          'icons' // folder path
        );

        if (error) {
          throw error;
        }

        if (url) {
          // Update category data with the icon URL
          categoryData.icon_url = url;
        }
      }

      setUploadingImage(false);

      // Create category with updated data
      const { data, error } = await adminDbService.createCategory(categoryData);

      if (error) {
        console.error('Error creating category:', error);
        toast.error(`Failed to create category: ${error.message || JSON.stringify(error) || 'Unknown error'}`);
        return;
      }

      if (data) {
        setCategories(prev => [...prev, data]);
        setShowAddModal(false);

        // Reset image state
        setSelectedImage(null);
        setImagePreview(null);
        setSelectedIcon(null);
        setIconPreview(null);

        toast.success('Category created successfully');
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

      // Convert empty parent_id to null to avoid UUID type error
      if (categoryData.parent_id === '') {
        categoryData.parent_id = null;
      }

      setUploadingImage(true);

      // Upload main image if selected
      if (selectedImage) {
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
      }

      // Upload icon if selected
      if (selectedIcon) {
        // Upload to Supabase storage
        const { url, error } = await storageService.uploadFile(
          selectedIcon,
          'categories', // bucket name
          'icons' // folder path
        );

        if (error) {
          throw error;
        }

        if (url) {
          // Update category data with the icon URL
          categoryData.icon_url = url;
        }
      }

      setUploadingImage(false);

      // Update category with updated data
      const { data, error } = await adminDbService.updateCategory(currentCategory.id, categoryData);

      if (error) {
        console.error('Error updating category:', error);
        toast.error(`Failed to update category: ${error.message || JSON.stringify(error) || 'Unknown error'}`);
        return;
      }

      if (data) {
        setCategories(prev => prev.map(c => (c.id === data.id ? data : c)));
        setShowEditModal(false);

        // Reset image state
        setSelectedImage(null);
        setImagePreview(null);
        setSelectedIcon(null);
        setIconPreview(null);

        toast.success('Category updated successfully');
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
      setDeletingCategory(true);

      const { error } = await adminDbService.deleteCategory(currentCategory.id);

      if (error) {
        console.error('Error deleting category:', error);
        toast.error(error.message || JSON.stringify(error) || 'Failed to delete category. Please try again.');
        return;
      }

      setCategories(prev => prev.filter(c => c.id !== currentCategory.id));
      setShowDeleteModal(false);
      toast.success(
        `${currentCategory.is_subcategory ? 'Subcategory' : 'Category'} deleted successfully.`
      );
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setDeletingCategory(false);
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
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PC Component
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.length > 0 ? (
              categories.map(category => (
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
                    {category.is_subcategory ? 'Subcategory' : 'Main Category'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.is_subcategory
                      ? categories.find(c => c.id === category.parent_id)?.name || 'Unknown'
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.slug}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {category.description || 'No description'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.pc_component_type ? (
                      <div className="flex items-center">
                        <span className="font-medium">{category.pc_component_type}</span>
                        {category.pc_required && <span className="ml-1 text-red-500">*</span>}
                        {category.pc_supports_multiple && <span className="ml-1 text-blue-500">(multiple)</span>}
                      </div>
                    ) : (
                      'Not a PC component'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(category)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    {/* Only show Spec Templates button for root categories */}
                    {!category.is_subcategory && (
                      <button
                        onClick={() => openTemplatesModal(category)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Spec Templates
                      </button>
                    )}
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close modal when clicking outside (on the overlay)
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
            }
          }}
        >
          <div className="bg-white rounded-lg p-6 md:p-8 max-w-md md:max-w-lg lg:max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 sticky top-0 bg-white pt-2">Add New Category</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  formErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug*</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  formErrors.slug ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.slug && <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded"
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Type</label>
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="is_subcategory"
                    checked={!formData.is_subcategory}
                    onChange={() =>
                      setFormData({ ...formData, is_subcategory: false, parent_id: '' })
                    }
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Main Category</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="is_subcategory"
                    checked={formData.is_subcategory}
                    onChange={() => setFormData({ ...formData, is_subcategory: true })}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Subcategory</span>
                </label>
              </div>
            </div>

            {/* Parent Category Selector (only visible for subcategories) */}
            {formData.is_subcategory && (
              <div className="mb-4">
                <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category*
                </label>
                <select
                  id="parent_id"
                  name="parent_id"
                  value={formData.parent_id}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${
                    formErrors.parent_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a parent category</option>
                  {getMainCategories().map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {formErrors.parent_id && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.parent_id}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Main Category Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Main Category Image</label>
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
                  <input type="hidden" id="image_url" name="image_url" value={formData.image_url} />

                  {/* Show URL if exists but no preview */}
                  {!imagePreview && formData.image_url && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-1">Current image:</p>
                      <div className="relative w-40 h-40 border border-gray-300 rounded-md overflow-hidden">
                        <Image
                          src={formData.image_url}
                          alt="Main image"
                          fill
                          sizes="160px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This image will be displayed on the main page.
                </p>
              </div>

              {/* Category Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Icon</label>
                <div className="flex flex-col space-y-2">
                  <input
                    type="file"
                    id="category_icon"
                    name="category_icon"
                    accept="image/*"
                    onChange={handleIconChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />

                  {/* Icon preview */}
                  {iconPreview && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-1">Preview:</p>
                      <div className="relative w-20 h-20 border border-gray-300 rounded-md overflow-hidden">
                        <Image
                          src={iconPreview}
                          alt="Icon Preview"
                          fill
                          sizes="80px"
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Current icon URL input (hidden but still part of form data) */}
                  <input type="hidden" id="icon_url" name="icon_url" value={formData.icon_url} />

                  {/* Show URL if exists but no preview */}
                  {!iconPreview && formData.icon_url && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-1">Current icon:</p>
                      <div className="relative w-20 h-20 border border-gray-300 rounded-md overflow-hidden">
                        <Image
                          src={formData.icon_url}
                          alt="Icon"
                          fill
                          sizes="80px"
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This icon will be displayed in the sidebar and PC Builder.
                </p>
              </div>
            </div>

            {/* PC Configurator Settings */}
            <div className="mb-4 border-t pt-4">
              <h3 className="text-lg font-medium mb-3">PC Configurator Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PC Component Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Component Type</label>
                  <input
                    type="text"
                    name="pc_component_type"
                    value={formData.pc_component_type}
                    onChange={handleInputChange}
                    placeholder="e.g., processor, memory, graphics-card"
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Identifier for PC configurator (leave empty if not a PC component)
                  </p>
                </div>

                {/* PC Display Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    name="pc_display_order"
                    value={formData.pc_display_order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Order in which components appear (lower numbers first)
                  </p>
                </div>

                {/* PC Required & Supports Multiple */}
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="pc_required"
                      name="pc_required"
                      checked={formData.pc_required}
                      onChange={(e) => setFormData({...formData, pc_required: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="pc_required" className="ml-2 block text-sm text-gray-900">
                      Required Component
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="pc_supports_multiple"
                      name="pc_supports_multiple"
                      checked={formData.pc_supports_multiple}
                      onChange={(e) => setFormData({...formData, pc_supports_multiple: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="pc_supports_multiple" className="ml-2 block text-sm text-gray-900">
                      Supports Multiple Components
                    </label>
                  </div>
                </div>
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close modal when clicking outside (on the overlay)
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
            }
          }}
        >
          <div className="bg-white rounded-lg p-6 md:p-8 max-w-md md:max-w-lg lg:max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 sticky top-0 bg-white pt-2">Edit Category</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  formErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug*</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  formErrors.slug ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.slug && <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded"
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Type</label>
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="is_subcategory"
                    checked={!formData.is_subcategory}
                    onChange={() =>
                      setFormData({ ...formData, is_subcategory: false, parent_id: '' })
                    }
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Main Category</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="is_subcategory"
                    checked={formData.is_subcategory}
                    onChange={() => setFormData({ ...formData, is_subcategory: true })}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Subcategory</span>
                </label>
              </div>
            </div>

            {/* Parent Category Selector (only visible for subcategories) */}
            {formData.is_subcategory && (
              <div className="mb-4">
                <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category*
                </label>
                <select
                  id="parent_id"
                  name="parent_id"
                  value={formData.parent_id}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${
                    formErrors.parent_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a parent category</option>
                  {getMainCategories().map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {formErrors.parent_id && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.parent_id}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Main Category Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Main Category Image</label>
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
                  <input type="hidden" id="image_url" name="image_url" value={formData.image_url} />

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
                <p className="text-xs text-gray-500 mt-1">
                  This image will be displayed on the main page.
                </p>
              </div>

              {/* Category Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Icon</label>
                <div className="flex flex-col space-y-2">
                  <input
                    type="file"
                    id="edit_category_icon"
                    name="edit_category_icon"
                    accept="image/*"
                    onChange={handleIconChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />

                  {/* Icon preview */}
                  {iconPreview && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-1">Preview:</p>
                      <div className="relative w-20 h-20 border border-gray-300 rounded-md overflow-hidden">
                        <Image
                          src={iconPreview}
                          alt="Icon Preview"
                          fill
                          sizes="80px"
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Current icon URL input (hidden but still part of form data) */}
                  <input type="hidden" id="icon_url" name="icon_url" value={formData.icon_url} />

                  {/* Show current icon if exists */}
                  {!iconPreview && formData.icon_url && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-1">Current icon:</p>
                      <div className="relative w-20 h-20 border border-gray-300 rounded-md overflow-hidden">
                        <Image
                          src={formData.icon_url}
                          alt="Icon"
                          fill
                          sizes="80px"
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This icon will be displayed in the sidebar and PC Builder.
                </p>
              </div>
            </div>

            {/* PC Configurator Settings */}
            <div className="mb-4 border-t pt-4">
              <h3 className="text-lg font-medium mb-3">PC Configurator Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PC Component Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Component Type</label>
                  <input
                    type="text"
                    name="pc_component_type"
                    value={formData.pc_component_type}
                    onChange={handleInputChange}
                    placeholder="e.g., processor, memory, graphics-card"
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Identifier for PC configurator (leave empty if not a PC component)
                  </p>
                </div>

                {/* PC Display Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    name="pc_display_order"
                    value={formData.pc_display_order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Order in which components appear (lower numbers first)
                  </p>
                </div>

                {/* PC Required & Supports Multiple */}
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edit_pc_required"
                      name="pc_required"
                      checked={formData.pc_required}
                      onChange={(e) => setFormData({...formData, pc_required: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="edit_pc_required" className="ml-2 block text-sm text-gray-900">
                      Required Component
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edit_pc_supports_multiple"
                      name="pc_supports_multiple"
                      checked={formData.pc_supports_multiple}
                      onChange={(e) => setFormData({...formData, pc_supports_multiple: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="edit_pc_supports_multiple" className="ml-2 block text-sm text-gray-900">
                      Supports Multiple Components
                    </label>
                  </div>
                </div>
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close modal when clicking outside (on the overlay)
            if (e.target === e.currentTarget) {
              setShowDeleteModal(false);
            }
          }}
        >
          <div className="bg-white rounded-lg p-5 md:p-6 max-w-sm md:max-w-md lg:max-w-lg w-full">
            <h2 className="text-xl font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-4">
              Are you sure you want to delete the category &quot;{currentCategory.name}&quot;? This
              action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={deletingCategory}
              >
                Cancel
              </button>
              <button
                onClick={deleteCategory}
                className="px-4 py-2 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600 flex items-center"
                disabled={deletingCategory}
              >
                {deletingCategory ? (
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

      {/* Specification Templates Modal */}
      {showTemplatesModal && currentCategory && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close modal when clicking outside (on the overlay)
            if (e.target === e.currentTarget) {
              setShowTemplatesModal(false);
            }
          }}
        >
          <div className="bg-white rounded-lg p-4 md:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pt-2 z-10">
              <h2 className="text-xl font-semibold">
                Specification Templates for &quot;{currentCategory.name}&quot;
              </h2>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingTemplates ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4">Loading templates...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Templates List */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Existing Templates</h3>
                  {specTemplates.length > 0 ? (
                    <div className="bg-gray-50 rounded-md overflow-hidden overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Display Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Data Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Required
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {specTemplates.map((template) => (
                            <tr key={template.id}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {template.name}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {template.display_name}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {template.data_type}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {template.is_required ? 'Yes' : 'No'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                                {template.description || 'No description'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => startEditingTemplate(template)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteTemplate(template.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 bg-gray-50 p-4 rounded-md">
                      No specification templates defined for this category yet.
                    </p>
                  )}
                </div>

                {/* Add/Edit Template Form */}
                <div className="bg-white border border-gray-200 rounded-md p-4 overflow-x-auto">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {editingTemplateId ? 'Edit Template' : 'Add New Template'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Name */}
                    <div>
                      <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-1">
                        Name* (internal identifier)
                      </label>
                      <input
                        type="text"
                        id="template-name"
                        name="name"
                        value={newTemplate.name}
                        onChange={handleTemplateInputChange}
                        placeholder="e.g., processor_speed"
                        className={`w-full p-2 border rounded-md ${
                          templateFormErrors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {templateFormErrors.name && (
                        <p className="mt-1 text-sm text-red-500">{templateFormErrors.name}</p>
                      )}
                    </div>

                    {/* Display Name */}
                    <div>
                      <label htmlFor="template-display-name" className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name* (shown to users)
                      </label>
                      <input
                        type="text"
                        id="template-display-name"
                        name="display_name"
                        value={newTemplate.display_name}
                        onChange={handleTemplateInputChange}
                        placeholder="e.g., Processor Speed"
                        className={`w-full p-2 border rounded-md ${
                          templateFormErrors.display_name ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {templateFormErrors.display_name && (
                        <p className="mt-1 text-sm text-red-500">{templateFormErrors.display_name}</p>
                      )}
                    </div>

                    {/* Data Type */}
                    <div>
                      <label htmlFor="template-data-type" className="block text-sm font-medium text-gray-700 mb-1">
                        Data Type
                      </label>
                      <select
                        id="template-data-type"
                        name="data_type"
                        value={newTemplate.data_type}
                        onChange={handleTemplateInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                      </select>
                    </div>

                    {/* Required */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="template-is-required"
                        name="is_required"
                        checked={newTemplate.is_required}
                        onChange={handleTemplateCheckboxChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="template-is-required" className="ml-2 block text-sm text-gray-900">
                        Required Field
                      </label>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label htmlFor="template-description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="template-description"
                      name="description"
                      rows={2}
                      value={newTemplate.description}
                      onChange={handleTemplateInputChange}
                      placeholder="Optional description of this specification"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    ></textarea>
                  </div>

                  <div className="flex justify-end space-x-3">
                    {editingTemplateId && (
                      <button
                        onClick={cancelEditingTemplate}
                        className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={editingTemplateId ? updateTemplate : addTemplate}
                      className="px-4 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600"
                    >
                      {editingTemplateId ? 'Update Template' : 'Add Template'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
