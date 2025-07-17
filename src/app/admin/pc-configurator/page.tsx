'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import * as dbService from '@/lib/supabase/db';
import * as adminDbService from '@/lib/supabase/adminDb';
import { Category } from '@/lib/supabase/types/types';
import {
  CategorySpecificationTemplate,
  CompatibilityRule,
} from '@/lib/supabase/types/specifications';
import Link from 'next/link';

// PC Configurator Admin Dashboard
export default function PCConfiguratorDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCategories: 0,
    totalTemplates: 0,
    totalRules: 0,
    keySpecTemplates: 0,
  });

  // Fetch statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch categories
        const { data: categories, error: categoriesError } = await dbService.getCategories();
        if (categoriesError) throw categoriesError;

        // Fetch all specification templates
        const { data: templates, error: templatesError } =
          await adminDbService.getAllSpecificationTemplates();
        if (templatesError) throw templatesError;

        // Fetch compatibility rules
        const { data: rules, error: rulesError } = await adminDbService.getCompatibilityRules();
        if (rulesError) throw rulesError;

        // Calculate statistics
        const mainCategories = categories?.filter(c => !c.is_subcategory) || [];
        const keyTemplates = templates?.filter(t => t.is_compatibility_key) || [];

        setStats({
          totalCategories: mainCategories.length,
          totalTemplates: templates?.length || 0,
          totalRules: rules?.length || 0,
          keySpecTemplates: keyTemplates.length,
        });
      } catch (error) {
        console.error('Error fetching statistics:', error);
        toast.error('Failed to load PC Configurator statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">PC Configurator Management</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Categories</p>
              <p className="text-2xl font-semibold mt-1">
                {loading ? '...' : stats.totalCategories}
              </p>
            </div>
            <div className="text-blue-500 text-3xl">🗂️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Specification Templates</p>
              <p className="text-2xl font-semibold mt-1">
                {loading ? '...' : stats.totalTemplates}
              </p>
            </div>
            <div className="text-blue-500 text-3xl">📋</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Compatibility Rules</p>
              <p className="text-2xl font-semibold mt-1">{loading ? '...' : stats.totalRules}</p>
            </div>
            <div className="text-blue-500 text-3xl">🔄</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Key Specifications</p>
              <p className="text-2xl font-semibold mt-1">
                {loading ? '...' : stats.keySpecTemplates}
              </p>
            </div>
            <div className="text-blue-500 text-3xl">🔑</div>
          </div>
        </div>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Specification Templates */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Specification Templates</h2>
            <Link
              href="/admin/pc-configurator/templates"
              className="text-blue-600 hover:text-blue-800"
            >
              Manage
            </Link>
          </div>
          <p className="text-gray-600 mb-4">
            Create and manage specification templates for product categories. Define data types,
            required fields, and compatibility keys.
          </p>
          <div className="mt-4">
            <Link
              href="/admin/pc-configurator/templates"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Manage Templates
            </Link>
          </div>
        </div>

        {/* Compatibility Rules */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Compatibility Rules</h2>
            <Link href="/admin/pc-configurator/rules" className="text-blue-600 hover:text-blue-800">
              Manage
            </Link>
          </div>
          <p className="text-gray-600 mb-4">
            Define rules for checking compatibility between different components. Create exact
            match, range check, and compatible values rules.
          </p>
          <div className="mt-4">
            <Link
              href="/admin/pc-configurator/rules"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Manage Rules
            </Link>
          </div>
        </div>

        {/* Bulk Specifications Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Bulk Specifications</h2>
            <Link
              href="/admin/pc-configurator/bulk-specs"
              className="text-blue-600 hover:text-blue-800"
            >
              Manage
            </Link>
          </div>
          <p className="text-gray-600 mb-4">
            Bulk edit product specifications, import from CSV/Excel, and apply templates to multiple
            products at once.
          </p>
          <div className="mt-4">
            <Link
              href="/admin/pc-configurator/bulk-specs"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Manage Specifications
            </Link>
          </div>
        </div>

        {/* Category Order Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Category Order</h2>
            <Link
              href="/admin/pc-configurator/categories"
              className="text-blue-600 hover:text-blue-800"
            >
              Manage
            </Link>
          </div>
          <p className="text-gray-600 mb-4">
            Manage the order of categories in the PC Configurator. Drag and drop categories to
            reorder them and control how they appear to users.
          </p>
          <div className="mt-4">
            <Link
              href="/admin/pc-configurator/categories"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Manage Category Order
            </Link>
          </div>
        </div>

        {/* Analytics and Reports */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Analytics & Reports</h2>
            <Link
              href="/admin/pc-configurator/analytics"
              className="text-blue-600 hover:text-blue-800"
            >
              View
            </Link>
          </div>
          <p className="text-gray-600 mb-4">
            View reports on specification completeness, find products with missing key
            specifications, and identify potential compatibility issues.
          </p>
          <div className="mt-4">
            <Link
              href="/admin/pc-configurator/analytics"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* Documentation */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">PC Configurator Documentation</h2>
        <p className="text-gray-600 mb-4">
          The PC Configurator system allows customers to build compatible PC configurations by
          selecting components that work together. The system uses specification templates and
          compatibility rules to ensure that only compatible components can be selected.
        </p>

        <div className="mt-6 border-t pt-6">
          <h3 className="text-md font-semibold mb-2">Key Concepts</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>
              <span className="font-medium">Specification Templates:</span> Define the types of
              specifications that products in a category can have (e.g., CPU Socket, Memory Type).
            </li>
            <li>
              <span className="font-medium">Compatibility Keys:</span> Special specifications that
              are used for compatibility checking between components.
            </li>
            <li>
              <span className="font-medium">Compatibility Rules:</span> Define how components should
              be checked for compatibility (e.g., CPU socket must match motherboard socket).
            </li>
            <li>
              <span className="font-medium">Typed Specifications:</span> Specifications with
              specific data types (text, number, enum, boolean) for more precise compatibility
              checking.
            </li>
          </ul>
        </div>

        <div className="mt-6">
          <Link
            href="/docs/pc-configurator.md"
            target="_blank"
            className="text-blue-600 hover:text-blue-800"
          >
            View Full Documentation →
          </Link>
        </div>
      </div>
    </div>
  );
}
