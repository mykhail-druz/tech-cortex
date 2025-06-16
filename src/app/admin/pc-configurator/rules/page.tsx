'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import * as dbService from '@/lib/supabase/db';
import * as adminDbService from '@/lib/supabase/adminDb';
import { Category } from '@/lib/supabase/types/types';
import {
  CompatibilityRule,
  CategorySpecificationTemplate,
  SpecificationDataType,
} from '@/lib/supabase/types/specifications';
import Link from 'next/link';

// Compatibility Rules Management Page
export default function CompatibilityRulesManagement() {
  const router = useRouter();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [rules, setRules] = useState<CompatibilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [currentRule, setCurrentRule] = useState<CompatibilityRule | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // State for primary and secondary category templates
  const [primaryTemplates, setPrimaryTemplates] = useState<CategorySpecificationTemplate[]>([]);
  const [secondaryTemplates, setSecondaryTemplates] = useState<CategorySpecificationTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Form data for creating/editing rules
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    primary_category_id: '',
    primary_specification_template_id: '',
    secondary_category_id: '',
    secondary_specification_template_id: '',
    rule_type: 'exact_match',
    compatible_values: [] as string[],
    min_value: null as number | null,
    max_value: null as number | null,
    custom_check_function: '',
  });

  // New compatible value input
  const [newCompatibleValue, setNewCompatibleValue] = useState('');

  // Fetch categories and rules
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch categories
        const categoriesResponse = await dbService.getCategories();
        if (categoriesResponse.data) {
          setCategories(categoriesResponse.data);
        }

        // Fetch compatibility rules
        const rulesResponse = await adminDbService.getCompatibilityRules();
        if (rulesResponse.data) {
          setRules(rulesResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Fetch templates when primary category changes
  useEffect(() => {
    const fetchPrimaryTemplates = async () => {
      if (!formData.primary_category_id) {
        setPrimaryTemplates([]);
        return;
      }

      setLoadingTemplates(true);
      try {
        const { data, error } = await adminDbService.getCategorySpecificationTemplates(
          formData.primary_category_id
        );

        if (error) {
          throw error;
        }

        // Filter for templates that are marked as compatibility keys
        const compatibilityTemplates = data?.filter(t => t.is_compatibility_key) || [];
        setPrimaryTemplates(compatibilityTemplates);
      } catch (error) {
        console.error('Error fetching primary templates:', error);
        toast.error('Failed to load primary category templates');
        setPrimaryTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchPrimaryTemplates();
  }, [formData.primary_category_id, toast]);

  // Fetch templates when secondary category changes
  useEffect(() => {
    const fetchSecondaryTemplates = async () => {
      if (!formData.secondary_category_id) {
        setSecondaryTemplates([]);
        return;
      }

      setLoadingTemplates(true);
      try {
        const { data, error } = await adminDbService.getCategorySpecificationTemplates(
          formData.secondary_category_id
        );

        if (error) {
          throw error;
        }

        // Filter for templates that are marked as compatibility keys
        const compatibilityTemplates = data?.filter(t => t.is_compatibility_key) || [];
        setSecondaryTemplates(compatibilityTemplates);
      } catch (error) {
        console.error('Error fetching secondary templates:', error);
        toast.error('Failed to load secondary category templates');
        setSecondaryTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchSecondaryTemplates();
  }, [formData.secondary_category_id, toast]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (name === 'min_value' || name === 'max_value') {
      setFormData({
        ...formData,
        [name]: value === '' ? null : parseFloat(value),
      });
    } else if (name === 'rule_type') {
      // Reset specific fields based on rule type
      if (value === 'exact_match') {
        setFormData({
          ...formData,
          rule_type: value,
          compatible_values: [],
          min_value: null,
          max_value: null,
          custom_check_function: '',
        });
      } else if (value === 'compatible_values') {
        setFormData({
          ...formData,
          rule_type: value,
          min_value: null,
          max_value: null,
          custom_check_function: '',
        });
      } else if (value === 'range_check') {
        setFormData({
          ...formData,
          rule_type: value,
          compatible_values: [],
          custom_check_function: '',
        });
      } else if (value === 'custom') {
        setFormData({
          ...formData,
          rule_type: value,
          compatible_values: [],
          min_value: null,
          max_value: null,
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Add a new compatible value
  const addCompatibleValue = () => {
    if (!newCompatibleValue.trim()) return;

    // Check if value already exists
    if (formData.compatible_values.includes(newCompatibleValue.trim())) {
      toast.error('This value already exists');
      return;
    }

    setFormData({
      ...formData,
      compatible_values: [...formData.compatible_values, newCompatibleValue.trim()],
    });
    setNewCompatibleValue('');
  };

  // Remove a compatible value
  const removeCompatibleValue = (index: number) => {
    const newValues = [...formData.compatible_values];
    newValues.splice(index, 1);
    setFormData({
      ...formData,
      compatible_values: newValues,
    });
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.primary_category_id) errors.primary_category_id = 'Primary category is required';
    if (!formData.primary_specification_template_id)
      errors.primary_specification_template_id = 'Primary specification is required';
    if (!formData.secondary_category_id)
      errors.secondary_category_id = 'Secondary category is required';
    if (!formData.secondary_specification_template_id)
      errors.secondary_specification_template_id = 'Secondary specification is required';

    // Validate rule type specific fields
    if (formData.rule_type === 'compatible_values' && formData.compatible_values.length === 0) {
      errors.compatible_values = 'At least one compatible value is required';
    }

    if (formData.rule_type === 'range_check') {
      if (formData.min_value === null && formData.max_value === null) {
        errors.range = 'Either minimum or maximum value is required';
      }
    }

    if (formData.rule_type === 'custom' && !formData.custom_check_function.trim()) {
      errors.custom_check_function = 'Custom check function is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open create modal
  const openCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      primary_category_id: '',
      primary_specification_template_id: '',
      secondary_category_id: '',
      secondary_specification_template_id: '',
      rule_type: 'exact_match',
      compatible_values: [],
      min_value: null,
      max_value: null,
      custom_check_function: '',
    });
    setFormErrors({});
    setPrimaryTemplates([]);
    setSecondaryTemplates([]);
    setShowCreateModal(true);
  };

  // Open edit modal
  const openEditModal = (rule: CompatibilityRule) => {
    setCurrentRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      primary_category_id: rule.primary_category_id,
      primary_specification_template_id: rule.primary_specification_template_id,
      secondary_category_id: rule.secondary_category_id,
      secondary_specification_template_id: rule.secondary_specification_template_id,
      rule_type: rule.rule_type,
      compatible_values: rule.compatible_values || [],
      min_value: rule.min_value,
      max_value: rule.max_value,
      custom_check_function: rule.custom_check_function || '',
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (rule: CompatibilityRule) => {
    setCurrentRule(rule);
    setShowDeleteModal(true);
  };

  // Open test modal
  const openTestModal = (rule: CompatibilityRule) => {
    setCurrentRule(rule);
    setShowTestModal(true);
  };

  // Create rule
  const createRule = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const { data, error } = await adminDbService.createCompatibilityRule({
        name: formData.name,
        description: formData.description || null,
        primary_category_id: formData.primary_category_id,
        primary_specification_template_id: formData.primary_specification_template_id,
        secondary_category_id: formData.secondary_category_id,
        secondary_specification_template_id: formData.secondary_specification_template_id,
        rule_type: formData.rule_type as
          | 'exact_match'
          | 'compatible_values'
          | 'range_check'
          | 'custom',
        compatible_values:
          formData.compatible_values.length > 0 ? formData.compatible_values : null,
        min_value: formData.min_value,
        max_value: formData.max_value,
        custom_check_function: formData.custom_check_function || null,
      });

      if (error) {
        throw error;
      }

      if (data) {
        // Refresh rules to get the full data with joined tables
        const rulesResponse = await adminDbService.getCompatibilityRules();
        if (rulesResponse.data) {
          setRules(rulesResponse.data);
        }

        setShowCreateModal(false);
        toast.success('Rule created successfully');
      }
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error('Failed to create rule');
    } finally {
      setSubmitting(false);
    }
  };

  // Update rule
  const updateRule = async () => {
    if (!validateForm() || !currentRule) return;

    setSubmitting(true);

    try {
      const { data, error } = await adminDbService.updateCompatibilityRule(currentRule.id, {
        name: formData.name,
        description: formData.description || null,
        primary_category_id: formData.primary_category_id,
        primary_specification_template_id: formData.primary_specification_template_id,
        secondary_category_id: formData.secondary_category_id,
        secondary_specification_template_id: formData.secondary_specification_template_id,
        rule_type: formData.rule_type as
          | 'exact_match'
          | 'compatible_values'
          | 'range_check'
          | 'custom',
        compatible_values:
          formData.compatible_values.length > 0 ? formData.compatible_values : null,
        min_value: formData.min_value,
        max_value: formData.max_value,
        custom_check_function: formData.custom_check_function || null,
      });

      if (error) {
        throw error;
      }

      if (data) {
        // Refresh rules to get the full data with joined tables
        const rulesResponse = await adminDbService.getCompatibilityRules();
        if (rulesResponse.data) {
          setRules(rulesResponse.data);
        }

        setShowEditModal(false);
        toast.success('Rule updated successfully');
      }
    } catch (error) {
      console.error('Error updating rule:', error);
      toast.error('Failed to update rule');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete rule
  const deleteRule = async () => {
    if (!currentRule) return;

    setSubmitting(true);

    try {
      const { error } = await adminDbService.deleteCompatibilityRule(currentRule.id);

      if (error) {
        throw error;
      }

      setRules(rules.filter(r => r.id !== currentRule.id));
      setShowDeleteModal(false);
      toast.success('Rule deleted successfully');
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete rule');
    } finally {
      setSubmitting(false);
    }
  };

  // Get rule type display name
  const getRuleTypeDisplay = (ruleType: string) => {
    switch (ruleType) {
      case 'exact_match':
        return 'Exact Match';
      case 'compatible_values':
        return 'Compatible Values';
      case 'range_check':
        return 'Range Check';
      case 'custom':
        return 'Custom Function';
      default:
        return ruleType;
    }
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  // Get template name by ID and category ID
  const getTemplateName = (templateId: string, categoryId: string) => {
    // First try to find it in the current templates state
    if (formData.primary_category_id === categoryId) {
      const template = primaryTemplates.find(t => t.id === templateId);
      if (template) return template.display_name;
    }

    if (formData.secondary_category_id === categoryId) {
      const template = secondaryTemplates.find(t => t.id === templateId);
      if (template) return template.display_name;
    }

    // If not found, try to find it in the rule data
    const rule = rules.find(
      r =>
        (r.primary_specification_template_id === templateId &&
          r.primary_category_id === categoryId) ||
        (r.secondary_specification_template_id === templateId &&
          r.secondary_category_id === categoryId)
    );

    if (rule) {
      if (rule.primary_specification_template_id === templateId) {
        return rule.primary_specification?.display_name || 'Unknown';
      } else {
        return rule.secondary_specification?.display_name || 'Unknown';
      }
    }

    return 'Unknown';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Compatibility Rules</h1>
        <Link
          href="/admin/pc-configurator"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Back
        </Link>
      </div>

      {/* Add Rule Button */}
      <div className="mb-6">
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add New Rule
        </button>
      </div>

      {/* Rules List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin mx-auto"></div>
              <p className="mt-4">Loading compatibility rules...</p>
            </div>
          </div>
        ) : rules.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No compatibility rules found. Create your first rule to define how components work
            together.
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
                    Primary Component
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Secondary Component
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rule Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rules.map(rule => (
                  <tr key={rule.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                      {rule.description && (
                        <div className="text-xs text-gray-500">{rule.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {rule.primary_category?.name || getCategoryName(rule.primary_category_id)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {rule.primary_specification?.display_name ||
                          getTemplateName(
                            rule.primary_specification_template_id,
                            rule.primary_category_id
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {rule.secondary_category?.name ||
                          getCategoryName(rule.secondary_category_id)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {rule.secondary_specification?.display_name ||
                          getTemplateName(
                            rule.secondary_specification_template_id,
                            rule.secondary_category_id
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getRuleTypeDisplay(rule.rule_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openEditModal(rule)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(rule)}
                        className="text-red-600 hover:text-red-900 mr-3"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => openTestModal(rule)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Test
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Create Compatibility Rule</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Name*
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
                  placeholder="e.g., CPU-Motherboard Socket Compatibility"
                />
                {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
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
                  placeholder="Optional description of this compatibility rule"
                ></textarea>
              </div>

              <div>
                <label
                  htmlFor="primary_category_id"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Primary Category*
                </label>
                <select
                  id="primary_category_id"
                  name="primary_category_id"
                  value={formData.primary_category_id}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${
                    formErrors.primary_category_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories
                    .filter(c => !c.is_subcategory)
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
                {formErrors.primary_category_id && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.primary_category_id}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="primary_specification_template_id"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Primary Specification*
                </label>
                <select
                  id="primary_specification_template_id"
                  name="primary_specification_template_id"
                  value={formData.primary_specification_template_id}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${
                    formErrors.primary_specification_template_id
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  disabled={!formData.primary_category_id || loadingTemplates}
                >
                  <option value="">Select a specification</option>
                  {primaryTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.display_name}
                    </option>
                  ))}
                </select>
                {formErrors.primary_specification_template_id && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.primary_specification_template_id}
                  </p>
                )}
                {formData.primary_category_id &&
                  primaryTemplates.length === 0 &&
                  !loadingTemplates && (
                    <p className="mt-1 text-sm text-yellow-500">
                      No compatibility key specifications found for this category. Please create
                      specifications with the "Compatibility Key" option enabled.
                    </p>
                  )}
              </div>

              <div>
                <label
                  htmlFor="secondary_category_id"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Secondary Category*
                </label>
                <select
                  id="secondary_category_id"
                  name="secondary_category_id"
                  value={formData.secondary_category_id}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${
                    formErrors.secondary_category_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories
                    .filter(c => !c.is_subcategory)
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
                {formErrors.secondary_category_id && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.secondary_category_id}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="secondary_specification_template_id"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Secondary Specification*
                </label>
                <select
                  id="secondary_specification_template_id"
                  name="secondary_specification_template_id"
                  value={formData.secondary_specification_template_id}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${
                    formErrors.secondary_specification_template_id
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  disabled={!formData.secondary_category_id || loadingTemplates}
                >
                  <option value="">Select a specification</option>
                  {secondaryTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.display_name}
                    </option>
                  ))}
                </select>
                {formErrors.secondary_specification_template_id && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.secondary_specification_template_id}
                  </p>
                )}
                {formData.secondary_category_id &&
                  secondaryTemplates.length === 0 &&
                  !loadingTemplates && (
                    <p className="mt-1 text-sm text-yellow-500">
                      No compatibility key specifications found for this category. Please create
                      specifications with the "Compatibility Key" option enabled.
                    </p>
                  )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="rule_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Type*
                </label>
                <select
                  id="rule_type"
                  name="rule_type"
                  value={formData.rule_type}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="exact_match">Exact Match</option>
                  <option value="compatible_values">Compatible Values</option>
                  <option value="range_check">Range Check</option>
                  <option value="custom">Custom Function</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.rule_type === 'exact_match' &&
                    'Exact Match: Values must match exactly (e.g., CPU socket must match motherboard socket)'}
                  {formData.rule_type === 'compatible_values' &&
                    'Compatible Values: Secondary value must be in a list of compatible values (e.g., GPU power connector must be one of the PSU supported connectors)'}
                  {formData.rule_type === 'range_check' &&
                    'Range Check: Secondary value must be within a specified range (e.g., PSU wattage must be >= GPU power requirement)'}
                  {formData.rule_type === 'custom' &&
                    'Custom Function: Use a custom SQL function for complex compatibility checks'}
                </p>
              </div>
            </div>

            {/* Rule Type Specific Fields */}
            {formData.rule_type === 'compatible_values' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compatible Values*
                </label>
                <div className="flex mb-2">
                  <input
                    type="text"
                    value={newCompatibleValue}
                    onChange={e => setNewCompatibleValue(e.target.value)}
                    className="flex-grow p-2 border border-gray-300 rounded-l-md"
                    placeholder="Add a compatible value"
                  />
                  <button
                    type="button"
                    onClick={addCompatibleValue}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {formErrors.compatible_values && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.compatible_values}</p>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.compatible_values.map((value, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                    >
                      <span className="text-sm">{value}</span>
                      <button
                        type="button"
                        onClick={() => removeCompatibleValue(index)}
                        className="ml-2 text-gray-500 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.rule_type === 'range_check' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="min_value"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Minimum Value
                  </label>
                  <input
                    type="number"
                    id="min_value"
                    name="min_value"
                    value={formData.min_value === null ? '' : formData.min_value}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Leave empty for no minimum"
                  />
                </div>

                <div>
                  <label
                    htmlFor="max_value"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Maximum Value
                  </label>
                  <input
                    type="number"
                    id="max_value"
                    name="max_value"
                    value={formData.max_value === null ? '' : formData.max_value}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Leave empty for no maximum"
                  />
                </div>

                {formErrors.range && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-red-500">{formErrors.range}</p>
                  </div>
                )}
              </div>
            )}

            {formData.rule_type === 'custom' && (
              <div className="mb-4">
                <label
                  htmlFor="custom_check_function"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Custom Check Function*
                </label>
                <textarea
                  id="custom_check_function"
                  name="custom_check_function"
                  value={formData.custom_check_function}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full p-2 border rounded-md ${
                    formErrors.custom_check_function ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter the name of a SQL function that will check compatibility"
                ></textarea>
                {formErrors.custom_check_function && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.custom_check_function}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  The function should accept two parameters: primary_value and secondary_value, and
                  return a boolean.
                </p>
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
                onClick={createRule}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Rule Modal */}
      {showEditModal && currentRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Edit Compatibility Rule</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="md:col-span-2">
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Name*
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
                  htmlFor="edit-primary_category_id"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Primary Category*
                </label>
                <select
                  id="edit-primary_category_id"
                  name="primary_category_id"
                  value={formData.primary_category_id}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${
                    formErrors.primary_category_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories
                    .filter(c => !c.is_subcategory)
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
                {formErrors.primary_category_id && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.primary_category_id}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-primary_specification_template_id"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Primary Specification*
                </label>
                <select
                  id="edit-primary_specification_template_id"
                  name="primary_specification_template_id"
                  value={formData.primary_specification_template_id}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${
                    formErrors.primary_specification_template_id
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  disabled={!formData.primary_category_id || loadingTemplates}
                >
                  <option value="">Select a specification</option>
                  {primaryTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.display_name}
                    </option>
                  ))}
                </select>
                {formErrors.primary_specification_template_id && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.primary_specification_template_id}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-secondary_category_id"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Secondary Category*
                </label>
                <select
                  id="edit-secondary_category_id"
                  name="secondary_category_id"
                  value={formData.secondary_category_id}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${
                    formErrors.secondary_category_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories
                    .filter(c => !c.is_subcategory)
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
                {formErrors.secondary_category_id && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.secondary_category_id}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-secondary_specification_template_id"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Secondary Specification*
                </label>
                <select
                  id="edit-secondary_specification_template_id"
                  name="secondary_specification_template_id"
                  value={formData.secondary_specification_template_id}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${
                    formErrors.secondary_specification_template_id
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  disabled={!formData.secondary_category_id || loadingTemplates}
                >
                  <option value="">Select a specification</option>
                  {secondaryTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.display_name}
                    </option>
                  ))}
                </select>
                {formErrors.secondary_specification_template_id && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.secondary_specification_template_id}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="edit-rule_type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Rule Type*
                </label>
                <select
                  id="edit-rule_type"
                  name="rule_type"
                  value={formData.rule_type}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="exact_match">Exact Match</option>
                  <option value="compatible_values">Compatible Values</option>
                  <option value="range_check">Range Check</option>
                  <option value="custom">Custom Function</option>
                </select>
              </div>
            </div>

            {/* Rule Type Specific Fields */}
            {formData.rule_type === 'compatible_values' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compatible Values*
                </label>
                <div className="flex mb-2">
                  <input
                    type="text"
                    value={newCompatibleValue}
                    onChange={e => setNewCompatibleValue(e.target.value)}
                    className="flex-grow p-2 border border-gray-300 rounded-l-md"
                    placeholder="Add a compatible value"
                  />
                  <button
                    type="button"
                    onClick={addCompatibleValue}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {formErrors.compatible_values && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.compatible_values}</p>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.compatible_values.map((value, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                    >
                      <span className="text-sm">{value}</span>
                      <button
                        type="button"
                        onClick={() => removeCompatibleValue(index)}
                        className="ml-2 text-gray-500 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.rule_type === 'range_check' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="edit-min_value"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Minimum Value
                  </label>
                  <input
                    type="number"
                    id="edit-min_value"
                    name="min_value"
                    value={formData.min_value === null ? '' : formData.min_value}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Leave empty for no minimum"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-max_value"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Maximum Value
                  </label>
                  <input
                    type="number"
                    id="edit-max_value"
                    name="max_value"
                    value={formData.max_value === null ? '' : formData.max_value}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Leave empty for no maximum"
                  />
                </div>

                {formErrors.range && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-red-500">{formErrors.range}</p>
                  </div>
                )}
              </div>
            )}

            {formData.rule_type === 'custom' && (
              <div className="mb-4">
                <label
                  htmlFor="edit-custom_check_function"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Custom Check Function*
                </label>
                <textarea
                  id="edit-custom_check_function"
                  name="custom_check_function"
                  value={formData.custom_check_function}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full p-2 border rounded-md ${
                    formErrors.custom_check_function ? 'border-red-500' : 'border-gray-300'
                  }`}
                ></textarea>
                {formErrors.custom_check_function && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.custom_check_function}</p>
                )}
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
                onClick={updateRule}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300"
                disabled={submitting}
              >
                {submitting ? 'Updating...' : 'Update Rule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-4">
              Are you sure you want to delete the rule &quot;{currentRule.name}&quot;? This action
              cannot be undone.
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
                onClick={deleteRule}
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

      {/* Test Rule Modal */}
      {showTestModal && currentRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-semibold mb-4">Test Compatibility Rule</h2>
            <p className="mb-6 text-gray-600">
              This feature will be implemented in a future update. It will allow you to test the
              rule with real products.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
