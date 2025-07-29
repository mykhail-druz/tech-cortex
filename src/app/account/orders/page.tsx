'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import * as dbService from '@/lib/supabase/db';
import { Order, OrderStatus } from '@/lib/supabase/types/types';

// Client component that uses useSearchParams
function OrdersContent() {
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  // Clear cart if redirected from successful payment
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      // Use a flag to ensure we only clear the cart once
      const hasCleared = sessionStorage.getItem('cart_cleared');
      if (!hasCleared) {
        clearCart();
        // Set a flag in session storage to prevent multiple clears
        sessionStorage.setItem('cart_cleared', 'true');
      }
    } else {
      // Reset the flag when not on a success page
      sessionStorage.removeItem('cart_cleared');
    }
  }, [searchParams, clearCart]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      // Use replace instead of push to prevent redirect loop when using browser back button
      router.replace('/auth/login?redirect=/account/orders');
    }
  }, [user, authLoading, router]);

  // Fetch orders when user is available
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await dbService.getUserOrders(user.id);

        if (error) {
          setError('Failed to load orders. Please try again.');
          console.error(error);
          return;
        }

        setOrders(data || []);
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Get status badge color
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.PROCESSING:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.SHIPPED:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.DELIVERED:
        return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case OrderStatus.RETURNED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || (isLoading && !error)) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">My Orders</h1>
          <div className="bg-white rounded-lg shadow-md p-8 flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">My Orders</h1>
          <Link href="/account" className="text-primary hover:text-primary/80 text-sm font-medium">
            Back to Account
          </Link>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">{error}</div>}

        {orders.length === 0 && !isLoading && !error ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h2 className="text-xl font-medium text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">You haven&apos;t placed any orders yet.</p>
            <Link
              href="/products"
              className="inline-block bg-primary text-white py-2 px-6 rounded-md hover:bg-primary/90 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {orders.map(order => (
                <li key={order.id} className="p-6 hover:bg-gray-50">
                  <Link href={`/account/orders/${order.id}`} className="block">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Order placed on {formatDate(order.created_at)}
                        </p>
                        <p className="font-medium mb-2">Order #{order.id.substring(0, 8)}</p>
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="mt-4 md:mt-0 text-right">
                        <p className="text-lg font-bold">{formatPrice(order.total_amount)}</p>
                        <p className="text-sm text-gray-500">
                          {order.payment_status.charAt(0).toUpperCase() +
                            order.payment_status.slice(1)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading fallback component
function OrdersLoading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">My Orders</h1>
        <div className="bg-white rounded-lg shadow-md p-8 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  );
}

// Main page component that wraps the client component in Suspense
export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersLoading />}>
      <OrdersContent />
    </Suspense>
  );
}
