'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useToast } from '@/contexts/ToastContext';
import * as dbService from '@/lib/supabase/db';
import * as adminDbService from '@/lib/supabase/adminDb';
import * as storageService from '@/lib/supabase/storageService';
import { Category } from '@/lib/supabase/types/types';
import { CategoryTemplateService } from '@/lib/specifications/CategoryTemplateService';
import { getAvailableCategorySlugs } from '@/lib/specifications/categoryTemplates';

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
    is_pc_component: false,
    pc_display_order: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // UI state for hierarchical display
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'created_at'>('name');
  const [filterText, setFilterText] = useState('');

  // Template selection state
  const [availableTemplateCategories, setAvailableTemplateCategories] = useState<string[]>([]);
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>('');
  const [applyTemplatesOnSave, setApplyTemplatesOnSave] = useState<boolean>(false);

  // Helper functions for hierarchical display
  const getMainCategories = () => {
    return categories.filter(cat => !cat.is_subcategory);
  };

  const getSubcategories = (parentId: string) => {
    return categories.filter(cat => cat.is_subcategory && cat.parent_id === parentId);
  };

  const getFilteredAndSortedCategories = () => {
    let filtered = categories;

    if (filterText) {
      filtered = categories.filter(
        cat =>
          cat.name.toLowerCase().includes(filterText.toLowerCase()) ||
          cat.description?.toLowerCase().includes(filterText.toLowerCase()) ||
          cat.slug.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Initialize expanded state for all main categories
  useEffect(() => {
    const mainCategories = getMainCategories();
    const allExpanded = new Set(mainCategories.map(cat => cat.id));
    setExpandedCategories(allExpanded);
  }, [categories]);

  // Initialize available template categories
  useEffect(() => {
    const templateCategories = getAvailableCategorySlugs();
    setAvailableTemplateCategories(templateCategories);
  }, []);

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
  const generateSlug = (name: string, parentSlug?: string) => {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-zA-Zа-яё0-9\s-]/g, '') // Keep Latin, Cyrillic, numbers, spaces, and hyphens
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // If parentSlug is provided, create composite slug for subcategory
    if (parentSlug) {
      return `${parentSlug}-${baseSlug}`;
    }

    return baseSlug;
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'name') {
      // Auto-generate slug when name changes
      let newSlug = generateSlug(value);

      // If this is a subcategory, include parent slug
      if (formData.is_subcategory && formData.parent_id) {
        const parentCategory = categories.find(cat => cat.id === formData.parent_id);
        if (parentCategory) {
          newSlug = generateSlug(value, parentCategory.slug);
        }
      }

      setFormData({
        ...formData,
        name: value,
        slug: newSlug,
      });
    } else if (name === 'parent_id') {
      // When parent changes, regenerate slug if we have a name
      let newSlug = formData.slug;

      if (formData.name && formData.is_subcategory && value) {
        const parentCategory = categories.find(cat => cat.id === value);
        if (parentCategory) {
          newSlug = generateSlug(formData.name, parentCategory.slug);
        }
      } else if (formData.name && (!formData.is_subcategory || !value)) {
        // If switching from subcategory to main category or clearing parent
        newSlug = generateSlug(formData.name);
      }

      setFormData({
        ...formData,
        [name]: value,
        slug: newSlug,
      });
    } else if (name === 'is_subcategory') {
      // When subcategory status changes, regenerate slug
      const isSubcategory = value === 'true' || value === true;
      let newSlug = formData.slug;

      if (formData.name) {
        if (isSubcategory && formData.parent_id) {
          const parentCategory = categories.find(cat => cat.id === formData.parent_id);
          if (parentCategory) {
            newSlug = generateSlug(formData.name, parentCategory.slug);
          }
        } else if (!isSubcategory) {
          // Switching to main category, use simple slug
          newSlug = generateSlug(formData.name);
        }
      }

      setFormData({
        ...formData,
        [name]: isSubcategory,
        slug: newSlug,
        // Clear parent_id if switching to main category
        parent_id: isSubcategory ? formData.parent_id : '',
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
      is_pc_component: false,
      pc_display_order: 0,
    });
    setFormErrors({});
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedIcon(null);
    setIconPreview(null);
    // Reset template selection state
    setSelectedTemplateCategory('');
    setApplyTemplatesOnSave(false);
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
      is_pc_component: category.is_pc_component || false,
      pc_display_order: category.pc_display_order || 0,
    });
    setFormErrors({});
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedIcon(null);
    setIconPreview(null);
    // Reset template selection state
    setSelectedTemplateCategory('');
    setApplyTemplatesOnSave(false);
    setShowEditModal(true);
  };

  // Open delete category modal
  const openDeleteModal = (category: Category) => {
    setCurrentCategory(category);
    setShowDeleteModal(true);
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
        toast.error(
          `Failed to create category: ${error.message || JSON.stringify(error) || 'Unknown error'}`
        );
        return;
      }

      if (data) {
        // Apply specification templates based on user selection
        if (applyTemplatesOnSave && selectedTemplateCategory) {
          try {
            const templateResult = await CategoryTemplateService.applyTemplatesForCategory(data.id, selectedTemplateCategory);
            if (templateResult.success && templateResult.templatesApplied > 0) {
              console.log(`✅ Applied ${templateResult.templatesApplied} specification templates (${selectedTemplateCategory.toUpperCase()}) to category "${data.name}"`);
              toast.success(`Category created successfully with ${templateResult.templatesApplied} ${selectedTemplateCategory.toUpperCase()} specification templates`);
            } else {
              console.log(`ℹ️ No templates applied for category "${data.name}" with template type "${selectedTemplateCategory}"`);
              toast.success("Category created successfully");
            }
          } catch (templateError) {
            console.error("Error applying templates:", templateError);
            toast.success("Category created successfully (templates could not be applied)");
          }
        } else {
          toast.success("Category created successfully");
        }
        
        setCategories(prev => [...prev, data]);
        setShowAddModal(false);

        // Reset image state
        setSelectedImage(null);
        setImagePreview(null);
        setSelectedIcon(null);
        setIconPreview(null);
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
        toast.error(
          `Failed to update category: ${error.message || JSON.stringify(error) || 'Unknown error'}`
        );
        return;
      }

      if (data) {
        // Apply specification templates based on user selection
        if (applyTemplatesOnSave && selectedTemplateCategory) {
          try {
            const templateResult = await CategoryTemplateService.updateTemplatesForCategory(data.id, selectedTemplateCategory);
            if (templateResult.success && templateResult.templatesUpdated > 0) {
              console.log(`✅ Applied ${templateResult.templatesUpdated} specification templates (${selectedTemplateCategory.toUpperCase()}) to category "${data.name}"`);
              toast.success(`Category updated successfully with ${templateResult.templatesUpdated} ${selectedTemplateCategory.toUpperCase()} specification templates`);
            } else {
              console.log(`ℹ️ No templates applied for category "${data.name}" with template type "${selectedTemplateCategory}"`);
              toast.success("Category updated successfully");
            }
          } catch (templateError) {
            console.error("Error applying templates:", templateError);
            toast.success("Category updated successfully (templates could not be applied)");
          }
        } else {
          toast.success('Category updated successfully');
        }
        
        setCategories(prev => prev.map(c => (c.id === data.id ? data : c)));
        setShowEditModal(false);

        // Reset image state
        setSelectedImage(null);
        setImagePreview(null);
        setSelectedIcon(null);
        setIconPreview(null);
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
        toast.error(
          error.message || JSON.stringify(error) || 'Failed to delete category. Please try again.'
        );
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

      {/* Filter and Sort Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
              Search Categories
            </label>
            <input
              type="text"
              id="filter"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder="Search by name, description, or slug..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="sm:w-48">
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'name' | 'created_at')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Name (A-Z)</option>
              <option value="created_at">Date Created</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hierarchical Categories Display */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {categories.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {getFilteredAndSortedCategories()
              .filter(cat => !cat.is_subcategory)
              .map(mainCategory => {
                const subcategories = getSubcategories(mainCategory.id);
                const isExpanded = expandedCategories.has(mainCategory.id);

                return (
                  <div key={mainCategory.id} className="bg-white">
                    {/* Main Category Row */}
                    <div className="px-6 py-4 border-l-4 border-blue-500 bg-blue-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          {/* Expand/Collapse Button */}
                          {subcategories.length > 0 && (
                            <button
                              onClick={() => toggleCategoryExpansion(mainCategory.id)}
                              className="mr-3 p-1 rounded hover:bg-blue-100 transition-colors"
                            >
                              <svg
                                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                          )}

                          {/* Category Image */}
                          {mainCategory.image_url && (
                            <div className="flex-shrink-0 h-12 w-12 mr-4">
                              <div className="relative h-12 w-12 rounded-lg overflow-hidden">
                                <Image
                                  className="object-cover"
                                  src={mainCategory.image_url}
                                  alt={mainCategory.name}
                                  fill
                                  sizes="48px"
                                />
                              </div>
                            </div>
                          )}

                          {/* Category Info */}
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h3 className="text-lg font-semibold text-gray-900 mr-3">
                                {mainCategory.name}
                              </h3>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Main Category
                              </span>
                              {subcategories.length > 0 && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {subcategories.length} subcategories
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                              <span className="font-medium">Slug:</span> {mainCategory.slug}
                            </div>
                            {mainCategory.description && (
                              <div className="mt-1 text-sm text-gray-600">
                                {mainCategory.description}
                              </div>
                            )}
                            {mainCategory.is_pc_component && (
                              <div className="mt-2 flex items-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  PC Component (Order: {mainCategory.pc_display_order || 0})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(mainCategory)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(mainCategory)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Subcategories */}
                    {isExpanded && subcategories.length > 0 && (
                      <div className="bg-gray-50">
                        {subcategories
                          .filter(
                            sub =>
                              !filterText ||
                              sub.name.toLowerCase().includes(filterText.toLowerCase()) ||
                              sub.description?.toLowerCase().includes(filterText.toLowerCase()) ||
                              sub.slug.toLowerCase().includes(filterText.toLowerCase())
                          )
                          .sort((a, b) => {
                            if (sortBy === 'name') {
                              return a.name.localeCompare(b.name);
                            } else {
                              return (
                                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                              );
                            }
                          })
                          .map(subcategory => (
                            <div
                              key={subcategory.id}
                              className="px-6 py-3 ml-8 border-l-2 border-gray-300"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center flex-1">
                                  {/* Subcategory Image */}
                                  {subcategory.image_url && (
                                    <div className="flex-shrink-0 h-8 w-8 mr-3">
                                      <div className="relative h-8 w-8 rounded overflow-hidden">
                                        <Image
                                          className="object-cover"
                                          src={subcategory.image_url}
                                          alt={subcategory.name}
                                          fill
                                          sizes="32px"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Subcategory Info */}
                                  <div className="flex-1">
                                    <div className="flex items-center">
                                      <h4 className="text-base font-medium text-gray-900 mr-3">
                                        {subcategory.name}
                                      </h4>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800">
                                        Subcategory
                                      </span>
                                    </div>
                                    <div className="mt-1 text-sm text-gray-600">
                                      <span className="font-medium">Slug:</span> {subcategory.slug}
                                    </div>
                                    {subcategory.description && (
                                      <div className="mt-1 text-sm text-gray-600">
                                        {subcategory.description}
                                      </div>
                                    )}
                                    {subcategory.is_pc_component && (
                                      <div className="mt-2 flex items-center">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                          PC Component (Order: {subcategory.pc_display_order || 0})
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Subcategory Actions */}
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => openEditModal(subcategory)}
                                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => openDeleteModal(subcategory)}
                                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
              <p className="mt-1 text-sm text-gray-500">Add your first category to get started.</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={e => {
            // Close modal when clicking outside (on the overlay)
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
            }
          }}
        >
          <div className="bg-white rounded-lg p-6 md:p-8 max-w-md md:max-w-lg lg:max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 sticky top-0 bg-white pt-2">
              Add New Category
            </h2>

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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Main Category Image
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Icon
                </label>
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

              {/* Include in PC Configurator checkbox */}
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_pc_component"
                    name="is_pc_component"
                    checked={formData.is_pc_component}
                    onChange={e => setFormData({ ...formData, is_pc_component: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="is_pc_component"
                    className="ml-2 block text-sm font-medium text-gray-900"
                  >
                    Include in PC Configurator
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  When checked, this category will be available in the PC Configurator component
                  list
                </p>
              </div>

              {formData.is_pc_component && (
                <div>
                  {/* PC Display Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Order
                    </label>
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
                </div>
              )}
            </div>

            {/* Specification Template Manager - Only for main categories */}
            {!formData.is_subcategory && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Specification Templates</h3>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="apply_templates_on_save"
                      checked={applyTemplatesOnSave}
                      onChange={(e) => setApplyTemplatesOnSave(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="apply_templates_on_save" className="ml-2 block text-sm font-medium text-gray-900">
                      Apply specification templates when creating category
                    </label>
                  </div>
                  
                  {applyTemplatesOnSave && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Template Category
                      </label>
                      <select
                        value={selectedTemplateCategory}
                        onChange={(e) => setSelectedTemplateCategory(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Choose a template category...</option>
                        {availableTemplateCategories.map((categorySlug) => (
                          <option key={categorySlug} value={categorySlug}>
                            {categorySlug.toUpperCase()} Templates
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Templates will be applied based on the selected category type
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

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
          onClick={e => {
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Main Category Image
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Icon
                </label>
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

              {/* Include in PC Configurator checkbox */}
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_is_pc_component"
                    name="is_pc_component"
                    checked={formData.is_pc_component}
                    onChange={e => setFormData({ ...formData, is_pc_component: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="edit_is_pc_component"
                    className="ml-2 block text-sm font-medium text-gray-900"
                  >
                    Include in PC Configurator
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  When checked, this category will be available in the PC Configurator component
                  list
                </p>
              </div>

              {formData.is_pc_component && (
                <div>
                  {/* PC Display Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Order
                    </label>
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
                </div>
              )}
            </div>

            {/* Specification Template Manager - Only for main categories */}
            {!formData.is_subcategory && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Specification Templates</h3>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="edit_apply_templates_on_save"
                      checked={applyTemplatesOnSave}
                      onChange={(e) => setApplyTemplatesOnSave(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="edit_apply_templates_on_save" className="ml-2 block text-sm font-medium text-gray-900">
                      Apply specification templates when updating category
                    </label>
                  </div>
                  
                  {applyTemplatesOnSave && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Template Category
                      </label>
                      <select
                        value={selectedTemplateCategory}
                        onChange={(e) => setSelectedTemplateCategory(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Choose a template category...</option>
                        {availableTemplateCategories.map((categorySlug) => (
                          <option key={categorySlug} value={categorySlug}>
                            {categorySlug.toUpperCase()} Templates
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Templates will be applied based on the selected category type
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

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
          onClick={e => {
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
    </div>
  );
}
