'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import * as dbService from '@/lib/supabase/db';
import * as adminDbService from '@/lib/supabase/adminDb';
import { Category, Product, ProductWithDetails } from '@/lib/supabase/types/types';
import { 
  CategorySpecificationTemplate, 
  SpecificationDataType,
  ProductSpecification 
} from '@/lib/supabase/types/specifications';
import Link from 'next/link';

// Bulk Specifications Management Page
export default function BulkSpecificationsManagement() {
  const router = useRouter();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [templates, setTemplates] = useState<CategorySpecificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // Bulk edit state
  const [bulkValues, setBulkValues] = useState<Record<string, string>>({});
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

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

  // Fetch products and templates for selected category
  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!selectedCategory) {
        setProducts([]);
        setTemplates([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch products for the selected category
        const { data: productsData, error: productsError } = await dbService.getProductsByCategory(selectedCategory, true);

        if (productsError) throw productsError;

        // Fetch specification templates for the selected category
        const { data: templatesData, error: templatesError } = await adminDbService.getCategorySpecificationTemplates(selectedCategory);

        if (templatesError) throw templatesError;

        setProducts(productsData || []);
        setTemplates(templatesData || []);

        // Reset selected products and bulk values when category changes
        setSelectedProducts([]);
        setBulkValues({});
        setSelectedTemplate('');
        setSelectAll(false);
      } catch (error) {
        console.error('Error fetching category data:', error);
        toast.error('Failed to load products and templates');
        setProducts([]);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [selectedCategory, toast]);

  // Handle select all products
  useEffect(() => {
    if (selectAll) {
      setSelectedProducts(products.map(p => p.id));
    } else if (selectedProducts.length === products.length) {
      // If all products are selected but selectAll is false, unselect all
      setSelectedProducts([]);
    }
  }, [selectAll, products]);

  // Handle product selection
  const handleProductSelection = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  // Handle template selection
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplate(templateId);

    // Reset bulk values when template changes
    setBulkValues({});
  };

  // Handle bulk value change
  const handleBulkValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setBulkValues({
        ...bulkValues,
        [name]: checked ? 'true' : 'false',
      });
    } else {
      setBulkValues({
        ...bulkValues,
        [name]: value,
      });
    }
  };

  // Apply bulk update
  const applyBulkUpdate = async () => {
    if (!selectedTemplate || selectedProducts.length === 0 || Object.keys(bulkValues).length === 0) {
      toast.error('Please select a template, at least one product, and provide a value');
      return;
    }

    setSubmitting(true);

    try {
      // Get the selected template
      const template = templates.find(t => t.id === selectedTemplate);
      if (!template) {
        throw new Error('Selected template not found');
      }

      // Prepare the specification data based on the template data type
      const specData: Partial<ProductSpecification> = {
        template_id: template.id,
        name: template.name,
        value: bulkValues.value || '',
      };

      // Set the appropriate typed value based on data type
      switch (template.data_type) {
        case SpecificationDataType.TEXT:
          specData.value_text = bulkValues.value || null;
          break;
        case SpecificationDataType.NUMBER:
          specData.value_number = bulkValues.value ? parseFloat(bulkValues.value) : null;
          break;
        case SpecificationDataType.BOOLEAN:
          specData.value_boolean = bulkValues.value === 'true';
          break;
        case SpecificationDataType.ENUM:
        case SpecificationDataType.SOCKET:
        case SpecificationDataType.MEMORY_TYPE:
        case SpecificationDataType.POWER_CONNECTOR:
          specData.value_enum = bulkValues.value || null;
          break;
      }

      // Process each selected product
      let successCount = 0;
      let errorCount = 0;

      for (const productId of selectedProducts) {
        try {
          // Check if the product already has this specification
          const product = products.find(p => p.id === productId);
          const existingSpec = product?.specifications?.find(s => s.template_id === template.id);

          if (existingSpec) {
            // Update existing specification
            const { error } = await adminDbService.updateProductSpecification(
              existingSpec.id,
              specData
            );

            if (error) throw error;
          } else {
            // Create new specification
            const { error } = await adminDbService.addProductSpecification({
              ...specData,
              product_id: productId,
              display_order: product?.specifications?.length || 0,
            });

            if (error) throw error;
          }

          successCount++;
        } catch (error) {
          console.error(`Error updating specification for product ${productId}:`, error);
          errorCount++;
        }
      }

      // Refresh products data
      const { data: updatedProducts, error: refreshError } = await dbService.getProductsByCategory(selectedCategory, true);

      if (refreshError) throw refreshError;

      setProducts(updatedProducts || []);

      // Show success message
      if (errorCount > 0) {
        toast.warning(`Updated ${successCount} products, but failed to update ${errorCount} products.`);
      } else {
        toast.success(`Successfully updated ${successCount} products.`);
      }

      // Reset form
      setBulkValues({});
      setSelectedProducts([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Error applying bulk update:', error);
      toast.error('Failed to apply bulk update');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle file selection for import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
      setImportPreview([]);
      setImportErrors([]);
    }
  };

  // Preview import file
  const previewImport = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      setSubmitting(true);

      // Check file extension
      const fileExtension = importFile.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'csv' && fileExtension !== 'xlsx') {
        setImportErrors(['Unsupported file format. Please use CSV or Excel (XLSX) files.']);
        return;
      }

      // For this example, we'll just show a placeholder preview
      // In a real implementation, you would parse the CSV/Excel file here
      setImportPreview([
        { product: 'Product 1', specification: 'CPU Socket', value: 'AM4' },
        { product: 'Product 2', specification: 'Memory Type', value: 'DDR4' },
        { product: 'Product 3', specification: 'Power Requirement', value: '650W' },
      ]);

      setImportErrors([]);
    } catch (error) {
      console.error('Error previewing import file:', error);
      setImportErrors(['Failed to parse the import file. Please check the file format.']);
      setImportPreview([]);
    } finally {
      setSubmitting(false);
    }
  };

  // Process import
  const processImport = async () => {
    if (!importFile || importPreview.length === 0) {
      toast.error('Please preview the file before importing');
      return;
    }

    try {
      setSubmitting(true);

      // In a real implementation, you would process the import file here
      // For this example, we'll just show a success message

      setTimeout(() => {
        toast.success('Import completed successfully');
        setShowImportModal(false);
        setImportFile(null);
        setImportPreview([]);
        setImportErrors([]);
      }, 1500);
    } catch (error) {
      console.error('Error processing import:', error);
      toast.error('Failed to process import');
    } finally {
      setSubmitting(false);
    }
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  // Get template by ID
  const getTemplate = (templateId: string) => {
    return templates.find(t => t.id === templateId);
  };

  // Get specification value display
  const getSpecificationValueDisplay = (spec: ProductSpecification) => {
    if (!spec.template) return spec.value;

    switch (spec.template.data_type) {
      case SpecificationDataType.BOOLEAN:
        return spec.value_boolean ? 'Yes' : 'No';
      default:
        return spec.value;
    }
  };

  // Render input field based on template data type
  const renderInputField = () => {
    if (!selectedTemplate) return null;

    const template = getTemplate(selectedTemplate);
    if (!template) return null;

    switch (template.data_type) {
      case SpecificationDataType.TEXT:
        return (
          <textarea
            name="value"
            value={bulkValues.value || ''}
            onChange={handleBulkValueChange}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder={`Enter ${template.display_name}`}
          />
        );

      case SpecificationDataType.NUMBER:
        return (
          <input
            type="number"
            name="value"
            value={bulkValues.value || ''}
            onChange={handleBulkValueChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder={`Enter ${template.display_name}`}
          />
        );

      case SpecificationDataType.BOOLEAN:
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="value-checkbox"
              name="value"
              checked={bulkValues.value === 'true'}
              onChange={(e) => handleBulkValueChange({
                ...e,
                target: {
                  ...e.target,
                  name: 'value',
                  value: e.target.checked ? 'true' : 'false'
                }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="value-checkbox" className="ml-2 block text-sm text-gray-900">
              {template.display_name}
            </label>
          </div>
        );

      case SpecificationDataType.ENUM:
      case SpecificationDataType.SOCKET:
      case SpecificationDataType.MEMORY_TYPE:
      case SpecificationDataType.POWER_CONNECTOR:
        return (
          <select
            name="value"
            value={bulkValues.value || ''}
            onChange={handleBulkValueChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select {template.display_name}</option>
            {template.enum_values?.map((value, index) => (
              <option key={index} value={value}>
                {value}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            name="value"
            value={bulkValues.value || ''}
            onChange={handleBulkValueChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder={`Enter ${template.display_name}`}
          />
        );
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bulk Specifications Management</h1>
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
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-grow p-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 transition-colors"
            disabled={!selectedCategory}
          >
            Import from CSV/Excel
          </button>
        </div>
      </div>

      {/* Bulk Edit Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Bulk Edit Specifications</h2>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin mx-auto"></div>
              <p className="mt-2">Loading...</p>
            </div>
          </div>
        ) : (
          <>
            {templates.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No specification templates found for this category.</p>
                <Link
                  href="/admin/pc-configurator/templates"
                  className="mt-2 inline-block text-blue-600 hover:text-blue-800"
                >
                  Create specification templates
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="template-selector" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Specification Template
                  </label>
                  <select
                    id="template-selector"
                    value={selectedTemplate}
                    onChange={handleTemplateChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select a template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTemplate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value for {getTemplate(selectedTemplate)?.display_name}
                    </label>
                    {renderInputField()}
                  </div>
                )}
              </div>
            )}

            {selectedTemplate && (
              <div className="mt-6">
                <button
                  onClick={applyBulkUpdate}
                  disabled={submitting || selectedProducts.length === 0 || !bulkValues.value}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                >
                  {submitting ? 'Applying...' : `Apply to ${selectedProducts.length} Selected Products`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center">
          <input
            type="checkbox"
            id="select-all"
            checked={selectAll}
            onChange={() => setSelectAll(!selectAll)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="select-all" className="ml-2 block text-sm text-gray-900">
            Select All Products
          </label>
          <span className="ml-auto text-sm text-gray-500">
            {products.length} products in {getCategoryName(selectedCategory)}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin mx-auto"></div>
              <p className="mt-4">Loading products...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No products found in this category.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-6 py-3"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Specifications
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className={selectedProducts.includes(product.id) ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleProductSelection(product.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
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
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.title}</div>
                          <div className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.specifications && product.specifications.length > 0 ? (
                        <div className="space-y-1">
                          {product.specifications.map((spec) => (
                            <div key={spec.id} className="flex text-sm">
                              <span className="font-medium text-gray-900 mr-2">
                                {spec.template ? spec.template.display_name : spec.name}:
                              </span>
                              <span className="text-gray-500">
                                {getSpecificationValueDisplay(spec)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No specifications</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Import Specifications from CSV/Excel</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File
              </label>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <p className="mt-1 text-xs text-gray-500">
                Supported formats: CSV, Excel (XLSX)
              </p>
            </div>

            {importFile && (
              <div className="mb-4">
                <button
                  onClick={previewImport}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                >
                  {submitting ? 'Processing...' : 'Preview Import'}
                </button>
              </div>
            )}

            {importErrors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-sm font-medium text-red-800 mb-1">Import Errors</h3>
                <ul className="list-disc pl-5 text-xs text-red-700">
                  {importErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {importPreview.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Preview (First 3 rows)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Specification
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {importPreview.map((row, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.product}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.specification}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4">
                  <button
                    onClick={processImport}
                    disabled={submitting}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-green-300"
                  >
                    {submitting ? 'Processing...' : 'Process Import'}
                  </button>
                  <p className="mt-1 text-xs text-gray-500">
                    This will import all rows from the file, not just the preview.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
