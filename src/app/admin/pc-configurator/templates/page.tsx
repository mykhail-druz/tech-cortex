'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import * as dbService from '@/lib/supabase/db';
import * as adminDbService from '@/lib/supabase/adminDb';
import { Category } from '@/lib/supabase/types/types';
import {
  CategorySpecificationTemplate,
  SpecificationDataType,
} from '@/lib/supabase/types/specifications';
import Link from 'next/link';

// Specification Templates Management Page
export default function SpecificationTemplatesManagement() {
  const router = useRouter();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<CategorySpecificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<CategorySpecificationTemplate | null>(
    null
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Form data for creating/editing templates
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    is_required: false,
    data_type: SpecificationDataType.TEXT,
    display_order: 0,
    is_compatibility_key: false,
    enum_values: [] as string[],
  });

  // New enum value input
  const [newEnumValue, setNewEnumValue] = useState('');

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await dbService.getCategories();
        if (error) throw error;

        // Filter out subcategories
        const mainCategories = data?.filter(c => !c.is_subcategory) || [];
        setCategories(mainCategories);

        // Set first category as selected if none is selected
        if (mainCategories.length > 0 && !selectedCategory) {
          setSelectedCategory(mainCategories[0].id);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      }
    };

    fetchCategories();
  }, [toast, selectedCategory]);

  // Fetch templates for selected category
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!selectedCategory) {
        setTemplates([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } =
          await adminDbService.getCategorySpecificationTemplates(selectedCategory);

        if (error) throw error;

        setTemplates(data || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast.error('Failed to load specification templates');
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [selectedCategory, toast]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else if (name === 'data_type') {
      // Reset enum_values if changing from enum type
      if (
        formData.data_type === SpecificationDataType.ENUM &&
        value !== SpecificationDataType.ENUM
      ) {
        setFormData({
          ...formData,
          data_type: value as SpecificationDataType,
          enum_values: [],
        });
      } else {
        setFormData({
          ...formData,
          data_type: value as SpecificationDataType,
        });
      }
    } else if (name === 'display_order') {
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Add a new enum value
  const addEnumValue = () => {
    if (!newEnumValue.trim()) return;

    // Check if value already exists
    if (formData.enum_values.includes(newEnumValue.trim())) {
      toast.error('This value already exists');
      return;
    }

    setFormData({
      ...formData,
      enum_values: [...formData.enum_values, newEnumValue.trim()],
    });
    setNewEnumValue('');
  };

  // Remove an enum value
  const removeEnumValue = (index: number) => {
    const newValues = [...formData.enum_values];
    newValues.splice(index, 1);
    setFormData({
      ...formData,
      enum_values: newValues,
    });
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.display_name.trim()) errors.display_name = 'Display name is required';

    // Validate enum values if data type is enum
    if (
      (formData.data_type === SpecificationDataType.ENUM ||
        formData.data_type === SpecificationDataType.SOCKET ||
        formData.data_type === SpecificationDataType.MEMORY_TYPE ||
        formData.data_type === SpecificationDataType.POWER_CONNECTOR) &&
      formData.enum_values.length === 0
    ) {
      errors.enum_values = 'At least one enum value is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open create modal
  const openCreateModal = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      is_required: false,
      data_type: SpecificationDataType.TEXT,
      display_order: templates.length,
      is_compatibility_key: false,
      enum_values: [],
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  // Open edit modal
  const openEditModal = (template: CategorySpecificationTemplate) => {
    setCurrentTemplate(template);
    setFormData({
      name: template.name,
      display_name: template.display_name,
      description: template.description || '',
      is_required: template.is_required,
      data_type: template.data_type as SpecificationDataType,
      display_order: template.display_order,
      is_compatibility_key: template.is_compatibility_key || false,
      enum_values: template.enum_values || [],
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (template: CategorySpecificationTemplate) => {
    setCurrentTemplate(template);
    setShowDeleteModal(true);
  };

  // Create template
  const createTemplate = async () => {
    if (!validateForm() || !selectedCategory) return;

    setSubmitting(true);

    try {
      const { data, error } = await adminDbService.createCategorySpecificationTemplate({
        category_id: selectedCategory,
        name: formData.name,
        display_name: formData.display_name,
        description: formData.description || null,
        is_required: formData.is_required,
        data_type: formData.data_type,
        display_order: formData.display_order,
        is_compatibility_key: formData.is_compatibility_key,
        enum_values: formData.enum_values.length > 0 ? formData.enum_values : null,
      });

      if (error) {
        throw error;
      }

      if (data) {
        setTemplates([...templates, data]);
        setShowCreateModal(false);
        toast.success('Template created successfully');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setSubmitting(false);
    }
  };

  // Update template
  const updateTemplate = async () => {
    if (!validateForm() || !currentTemplate) return;

    setSubmitting(true);

    try {
      const { data, error } = await adminDbService.updateCategorySpecificationTemplate(
        currentTemplate.id,
        {
          name: formData.name,
          display_name: formData.display_name,
          description: formData.description || null,
          is_required: formData.is_required,
          data_type: formData.data_type,
          display_order: formData.display_order,
          is_compatibility_key: formData.is_compatibility_key,
          enum_values: formData.enum_values.length > 0 ? formData.enum_values : null,
        }
      );

      if (error) {
        throw error;
      }

      if (data) {
        setTemplates(templates.map(t => (t.id === currentTemplate.id ? data : t)));
        setShowEditModal(false);
        toast.success('Template updated successfully');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete template
  const deleteTemplate = async () => {
    if (!currentTemplate) return;

    setSubmitting(true);

    try {
      const { error } = await adminDbService.deleteCategorySpecificationTemplate(
        currentTemplate.id
      );

      if (error) {
        throw error;
      }

      setTemplates(templates.filter(t => t.id !== currentTemplate.id));
      setShowDeleteModal(false);
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template. It may be in use by product specifications.');
    } finally {
      setSubmitting(false);
    }
  };

  // Get data type display name
  const getDataTypeDisplay = (dataType: string) => {
    switch (dataType) {
      case SpecificationDataType.TEXT:
        return 'Text';
      case SpecificationDataType.NUMBER:
        return 'Number';
      case SpecificationDataType.ENUM:
        return 'Enum';
      case SpecificationDataType.BOOLEAN:
        return 'Boolean';
      case SpecificationDataType.SOCKET:
        return 'Socket';
      case SpecificationDataType.MEMORY_TYPE:
        return 'Memory Type';
      case SpecificationDataType.POWER_CONNECTOR:
        return 'Power Connector';
      default:
        return dataType;
    }
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Specification Templates</h1>
        <Link
          href="/admin/pc-configurator"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Back
        </Link>
      </div>

      {/* Category Selector */}
      <div className="mb-6">
        <label htmlFor="category-selector" className="block text-sm font-medium text-gray-700 mb-1">
          Select Category
        </label>
        <div className="flex">
          <select
            id="category-selector"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="flex-grow p-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
            disabled={!selectedCategory}
          >
            Add Template
          </button>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin mx-auto"></div>
              <p className="mt-4">Loading specification templates...</p>
            </div>
          </div>
        ) : templates.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {selectedCategory ? (
              <>
                <p>No specification templates found for this category.</p>
                <button
                  onClick={openCreateModal}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create First Template
                </button>
              </>
            ) : (
              <p>Please select a category to manage its specification templates.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Display Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Required
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compatibility Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map(template => (
                  <tr key={template.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{template.name}</div>
                      {template.description && (
                        <div className="text-xs text-gray-500">{template.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{template.display_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getDataTypeDisplay(template.data_type)}
                      </span>
                      {(template.data_type === SpecificationDataType.ENUM ||
                        template.data_type === SpecificationDataType.SOCKET ||
                        template.data_type === SpecificationDataType.MEMORY_TYPE ||
                        template.data_type === SpecificationDataType.POWER_CONNECTOR) &&
                        template.enum_values && (
                          <div className="text-xs text-gray-500 mt-1">
                            Values: {template.enum_values.join(', ')}
                          </div>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          template.is_required
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {template.is_required ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          template.is_compatibility_key
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {template.is_compatibility_key ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openEditModal(template)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(template)}
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
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Create Specification Template</h2>
            <p className="text-gray-600 mb-4">
              Creating a template for category: <strong>{getCategoryName(selectedCategory)}</strong>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name* (Internal)
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., processor_model"
                />
                {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  Internal name used in code. Use lowercase with underscores.
                </p>
              </div>

              <div>
                <label
                  htmlFor="display_name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Display Name*
                </label>
                <input
                  type="text"
                  id="display_name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${
                    formErrors.display_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Processor Model"
                />
                {formErrors.display_name && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.display_name}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">User-friendly name shown in the UI.</p>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Optional description of this specification"
                ></textarea>
              </div>

              <div>
                <label htmlFor="data_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Data Type*
                </label>
                <select
                  id="data_type"
                  name="data_type"
                  value={formData.data_type}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value={SpecificationDataType.TEXT}>Text</option>
                  <option value={SpecificationDataType.NUMBER}>Number</option>
                  <option value={SpecificationDataType.ENUM}>Enum (Custom)</option>
                  <option value={SpecificationDataType.BOOLEAN}>Boolean</option>
                  <option value={SpecificationDataType.SOCKET}>Socket</option>
                  <option value={SpecificationDataType.MEMORY_TYPE}>Memory Type</option>
                  <option value={SpecificationDataType.POWER_CONNECTOR}>Power Connector</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="display_order"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Display Order
                </label>
                <input
                  type="number"
                  id="display_order"
                  name="display_order"
                  value={formData.display_order}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_required"
                  name="is_required"
                  checked={formData.is_required}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_required" className="ml-2 block text-sm text-gray-900">
                  Required
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_compatibility_key"
                  name="is_compatibility_key"
                  checked={formData.is_compatibility_key}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_compatibility_key" className="ml-2 block text-sm text-gray-900">
                  Compatibility Key
                </label>
                <div className="ml-2 group relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Mark as a compatibility key to use this specification for compatibility checking
                    between components.
                  </div>
                </div>
              </div>
            </div>

            {/* Enum Values Section */}
            {(formData.data_type === SpecificationDataType.ENUM ||
              formData.data_type === SpecificationDataType.SOCKET ||
              formData.data_type === SpecificationDataType.MEMORY_TYPE ||
              formData.data_type === SpecificationDataType.POWER_CONNECTOR) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Enum Values*</label>
                <div className="flex mb-2">
                  <input
                    type="text"
                    value={newEnumValue}
                    onChange={e => setNewEnumValue(e.target.value)}
                    className="flex-grow p-2 border border-gray-300 rounded-l-md"
                    placeholder="Add a value"
                  />
                  <button
                    type="button"
                    onClick={addEnumValue}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {formErrors.enum_values && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.enum_values}</p>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.enum_values.map((value, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                    >
                      <span className="text-sm">{value}</span>
                      <button
                        type="button"
                        onClick={() => removeEnumValue(index)}
                        className="ml-2 text-gray-500 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {formData.data_type === SpecificationDataType.SOCKET &&
                  formData.enum_values.length === 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          enum_values: ['AM4', 'AM5', 'LGA1700', 'LGA1200'],
                        })
                      }
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Add standard socket types
                    </button>
                  )}

                {formData.data_type === SpecificationDataType.MEMORY_TYPE &&
                  formData.enum_values.length === 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          enum_values: ['DDR4', 'DDR5'],
                        })
                      }
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Add standard memory types
                    </button>
                  )}

                {formData.data_type === SpecificationDataType.POWER_CONNECTOR &&
                  formData.enum_values.length === 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          enum_values: ['6-pin', '8-pin', '24-pin'],
                        })
                      }
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Add standard power connector types
                    </button>
                  )}
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditModal && currentTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Edit Specification Template</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name* (Internal)
                </label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
              </div>

              <div>
                <label
                  htmlFor="edit-display_name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Display Name*
                </label>
                <input
                  type="text"
                  id="edit-display_name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${
                    formErrors.display_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.display_name && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.display_name}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="edit-description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>

              <div>
                <label
                  htmlFor="edit-data_type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Data Type*
                </label>
                <select
                  id="edit-data_type"
                  name="data_type"
                  value={formData.data_type}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value={SpecificationDataType.TEXT}>Text</option>
                  <option value={SpecificationDataType.NUMBER}>Number</option>
                  <option value={SpecificationDataType.ENUM}>Enum (Custom)</option>
                  <option value={SpecificationDataType.BOOLEAN}>Boolean</option>
                  <option value={SpecificationDataType.SOCKET}>Socket</option>
                  <option value={SpecificationDataType.MEMORY_TYPE}>Memory Type</option>
                  <option value={SpecificationDataType.POWER_CONNECTOR}>Power Connector</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="edit-display_order"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Display Order
                </label>
                <input
                  type="number"
                  id="edit-display_order"
                  name="display_order"
                  value={formData.display_order}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-is_required"
                  name="is_required"
                  checked={formData.is_required}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="edit-is_required" className="ml-2 block text-sm text-gray-900">
                  Required
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-is_compatibility_key"
                  name="is_compatibility_key"
                  checked={formData.is_compatibility_key}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="edit-is_compatibility_key"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Compatibility Key
                </label>
              </div>
            </div>

            {/* Enum Values Section */}
            {(formData.data_type === SpecificationDataType.ENUM ||
              formData.data_type === SpecificationDataType.SOCKET ||
              formData.data_type === SpecificationDataType.MEMORY_TYPE ||
              formData.data_type === SpecificationDataType.POWER_CONNECTOR) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Enum Values*</label>
                <div className="flex mb-2">
                  <input
                    type="text"
                    value={newEnumValue}
                    onChange={e => setNewEnumValue(e.target.value)}
                    className="flex-grow p-2 border border-gray-300 rounded-l-md"
                    placeholder="Add a value"
                  />
                  <button
                    type="button"
                    onClick={addEnumValue}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {formErrors.enum_values && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.enum_values}</p>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.enum_values.map((value, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                    >
                      <span className="text-sm">{value}</span>
                      <button
                        type="button"
                        onClick={() => removeEnumValue(index)}
                        className="ml-2 text-gray-500 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={updateTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300"
                disabled={submitting}
              >
                {submitting ? 'Updating...' : 'Update Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-4">
              Are you sure you want to delete the template &quot;{currentTemplate.display_name}
              &quot;? This action cannot be undone.
            </p>
            <p className="mb-4 text-yellow-600">
              Warning: If this template is used by any product specifications, the delete operation
              will fail.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={deleteTemplate}
                className="px-4 py-2 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600 flex items-center"
                disabled={submitting}
              >
                {submitting ? (
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
