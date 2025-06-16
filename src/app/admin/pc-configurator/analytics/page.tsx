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
  CompatibilityRule
} from '@/lib/supabase/types/specifications';
import Link from 'next/link';

// Analytics and Reports Page
export default function PCConfiguratorAnalytics() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [templates, setTemplates] = useState<CategorySpecificationTemplate[]>([]);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [compatibilityRules, setCompatibilityRules] = useState<CompatibilityRule[]>([]);
  
  // Analytics data
  const [productsWithoutKeySpecs, setProductsWithoutKeySpecs] = useState<ProductWithDetails[]>([]);
  const [compatibilityIssues, setCompatibilityIssues] = useState<any[]>([]);
  const [specCompletionStats, setSpecCompletionStats] = useState<{
    total: number;
    complete: number;
    incomplete: number;
    completionRate: number;
  }>({
    total: 0,
    complete: 0,
    incomplete: 0,
    completionRate: 0
  });
  
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
  
  // Fetch compatibility rules
  useEffect(() => {
    const fetchCompatibilityRules = async () => {
      try {
        const { data, error } = await adminDbService.getCompatibilityRules();
        if (error) throw error;
        
        setCompatibilityRules(data || []);
      } catch (error) {
        console.error('Error fetching compatibility rules:', error);
        toast.error('Failed to load compatibility rules');
      }
    };
    
    fetchCompatibilityRules();
  }, [toast]);
  
  // Fetch data for selected category
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
        
        // Generate analytics data
        generateAnalytics(productsData || [], templatesData || []);
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
  
  // Generate analytics data
  const generateAnalytics = (products: ProductWithDetails[], templates: CategorySpecificationTemplate[]) => {
    // Find products without key specifications
    const keyTemplates = templates.filter(t => t.is_compatibility_key);
    const productsWithoutKeys = products.filter(product => {
      // For each key template, check if the product has a specification for it
      for (const template of keyTemplates) {
        const hasSpec = product.specifications?.some(spec => spec.template_id === template.id);
        if (!hasSpec) return true;
      }
      return false;
    });
    
    setProductsWithoutKeySpecs(productsWithoutKeys);
    
    // Calculate specification completion statistics
    const totalRequiredSpecs = products.length * templates.filter(t => t.is_required).length;
    let completedSpecs = 0;
    
    products.forEach(product => {
      templates.filter(t => t.is_required).forEach(template => {
        const hasSpec = product.specifications?.some(spec => spec.template_id === template.id);
        if (hasSpec) completedSpecs++;
      });
    });
    
    const incompleteSpecs = totalRequiredSpecs - completedSpecs;
    const completionRate = totalRequiredSpecs > 0 ? (completedSpecs / totalRequiredSpecs) * 100 : 0;
    
    setSpecCompletionStats({
      total: totalRequiredSpecs,
      complete: completedSpecs,
      incomplete: incompleteSpecs,
      completionRate: completionRate
    });
    
    // Find potential compatibility issues
    // This is a simplified example - in a real implementation, you would use the compatibility functions
    const issues: any[] = [];
    
    // Check for products that might have compatibility issues based on rules
    const categoryRules = compatibilityRules.filter(rule => 
      rule.primary_category_id === selectedCategory || rule.secondary_category_id === selectedCategory
    );
    
    if (categoryRules.length > 0) {
      products.forEach(product => {
        categoryRules.forEach(rule => {
          // Check if this product is the primary or secondary in the rule
          const isPrimary = rule.primary_category_id === selectedCategory;
          const specTemplateId = isPrimary ? rule.primary_specification_template_id : rule.secondary_specification_template_id;
          
          // Check if the product has the required specification
          const hasSpec = product.specifications?.some(spec => spec.template_id === specTemplateId);
          
          if (!hasSpec) {
            // Find the template name
            const template = templates.find(t => t.id === specTemplateId);
            
            issues.push({
              product: product,
              rule: rule,
              issue: `Missing required specification: ${template?.display_name || 'Unknown'}`
            });
          }
        });
      });
    }
    
    setCompatibilityIssues(issues);
  };
  
  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">PC Configurator Analytics</h1>
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
        <select
          id="category-selector"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4">Loading analytics data...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Specification Completion Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Specification Completion</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{specCompletionStats.total}</div>
                <div className="text-sm text-gray-600">Total Required Specifications</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{specCompletionStats.complete}</div>
                <div className="text-sm text-gray-600">Completed Specifications</div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{specCompletionStats.incomplete}</div>
                <div className="text-sm text-gray-600">Missing Specifications</div>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                <span className="text-sm font-medium text-gray-700">{specCompletionStats.completionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${specCompletionStats.completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Products Without Key Specifications */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Products Without Key Specifications</h2>
            
            {productsWithoutKeySpecs.length === 0 ? (
              <div className="text-center py-4 text-green-600">
                <p>All products have their key specifications filled. Great job! 🎉</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Missing Key Specifications
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productsWithoutKeySpecs.map((product) => {
                      // Find missing key specifications
                      const keyTemplates = templates.filter(t => t.is_compatibility_key);
                      const missingSpecs = keyTemplates.filter(template => {
                        return !product.specifications?.some(spec => spec.template_id === template.id);
                      });
                      
                      return (
                        <tr key={product.id}>
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
                            <div className="space-y-1">
                              {missingSpecs.map((template) => (
                                <div key={template.id} className="flex items-center">
                                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 text-red-500 mr-2">
                                    !
                                  </span>
                                  <span className="text-sm text-gray-700">{template.display_name}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Link
                              href={`/admin/products/edit/${product.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit Product
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Compatibility Issues */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Potential Compatibility Issues</h2>
            
            {compatibilityIssues.length === 0 ? (
              <div className="text-center py-4 text-green-600">
                <p>No potential compatibility issues detected. 👍</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Related Rule
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {compatibilityIssues.map((issue, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {issue.product.main_image_url && (
                              <div className="flex-shrink-0 h-10 w-10">
                                <img
                                  className="h-10 w-10 rounded-md object-cover"
                                  src={issue.product.main_image_url}
                                  alt={issue.product.title}
                                />
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{issue.product.title}</div>
                              <div className="text-xs text-gray-500">SKU: {issue.product.sku || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-red-600">{issue.issue}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">{issue.rule.name}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Link
                            href={`/admin/products/edit/${issue.product.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit Product
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Template Usage Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Specification Template Usage</h2>
            
            {templates.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p>No specification templates found for this category.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Template
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completion
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {templates.map((template) => {
                      // Calculate usage statistics
                      const productsWithSpec = products.filter(product => 
                        product.specifications?.some(spec => spec.template_id === template.id)
                      );
                      const usageCount = productsWithSpec.length;
                      const usagePercentage = products.length > 0 ? (usageCount / products.length) * 100 : 0;
                      
                      return (
                        <tr key={template.id}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {template.display_name}
                              {template.is_compatibility_key && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Key
                                </span>
                              )}
                              {template.is_required && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Required
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700">{template.data_type}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700">
                              {usageCount} / {products.length} products ({usagePercentage.toFixed(1)}%)
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  usagePercentage >= 80 ? 'bg-green-600' : 
                                  usagePercentage >= 50 ? 'bg-yellow-400' : 'bg-red-600'
                                }`}
                                style={{ width: `${usagePercentage}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}