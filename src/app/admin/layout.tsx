'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { FaChartBar, FaMoneyBillWave, FaRegUser } from 'react-icons/fa';
import { AiOutlineProduct } from 'react-icons/ai';
import { MdOutlineCategory } from 'react-icons/md';

// Admin layout component
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isManager, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if not admin or manager
  React.useEffect(() => {
    if (!isLoading && !isAdmin && !isManager) {
      router.push('/auth/login?redirect=/admin');
    }
  }, [isAdmin, isManager, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if not admin or manager
  if (!isAdmin && !isManager) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-semibold text-gray-800">Admin Panel</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link href="/admin" className="flex items-center p-2 rounded hover:bg-gray-100">
                <FaChartBar className="h-6 w-6 mr-3 text-blue-600" />

                <p>Dashboard</p>
              </Link>
            </li>
            <li>
              <Link
                href="/admin/products"
                className="flex items-center p-2 rounded hover:bg-gray-100"
              >
                <AiOutlineProduct className="h-6 w-6 mr-3 text-blue-600" />

                <p>Products</p>
              </Link>
            </li>
            <li>
              <Link
                href="/admin/categories"
                className="flex items-center p-2 rounded hover:bg-gray-100"
              >
                <MdOutlineCategory className="h-6 w-6 mr-3 text-blue-600" />

                <p>Categories</p>
              </Link>
            </li>
            <li>
              <Link
                href="/admin/orders"
                className="flex items-center p-2 rounded hover:bg-gray-100"
              >
                <FaMoneyBillWave className="h-6 w-6 mr-3 text-blue-600" />

                <p>Orders</p>
              </Link>
            </li>
            <li>
              <Link href="/admin/users" className="flex items-center p-2 rounded hover:bg-gray-100">
                <FaRegUser className="h-6 w-6 mr-3 text-blue-600" />

                <p>Users</p>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <main className="p-6 h-[calc(100vh-64px)] overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
