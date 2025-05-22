'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import * as dbService from '@/lib/supabase/db';
import { OrderWithItems, OrderStatus, PaymentStatus } from '@/lib/supabase/types';

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const { user, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const orderId = params.id;

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/login?redirect=/account/orders/${orderId}`);
    }
  }, [user, authLoading, router, orderId]);

  // Fetch order details when user is available
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!user || !orderId) return;

      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await dbService.getOrderById(orderId, user.id);

        if (error) {
          setError('Failed to load order details. Please try again.');
          console.error(error);
          return;
        }

        setOrder(data);
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && orderId) {
      fetchOrderDetails();
    }
  }, [user, orderId]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  // Get payment status badge color
  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case PaymentStatus.PAID:
        return 'bg-green-100 text-green-800';
      case PaymentStatus.FAILED:
        return 'bg-red-100 text-red-800';
      case PaymentStatus.REFUNDED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || (isLoading && !error)) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Order Details</h1>
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">Order Details</h1>
            <Link
              href="/account/orders"
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              Back to Orders
            </Link>
          </div>
          <div className="bg-red-50 text-red-600 p-4 rounded-md">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">Order Details</h1>
            <Link
              href="/account/orders"
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              Back to Orders
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-2">Order not found</h2>
            <p className="text-gray-500 mb-6">The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Order Details</h1>
          <Link
            href="/account/orders"
            className="text-primary hover:text-primary/80 text-sm font-medium"
          >
            Back to Orders
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Order placed on {formatDate(order.created_at)}
                </p>
                <p className="font-medium mb-2">Order #{order.id.substring(0, 8)}</p>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(
                      order.payment_status
                    )}`}
                  >
                    Payment: {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <p className="text-lg font-bold">{formatPrice(order.total_amount)}</p>
                {order.tracking_number && (
                  <p className="text-sm text-gray-500">
                    Tracking: {order.tracking_number}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-lg font-medium mb-4">Order Items</h2>
            <ul className="divide-y divide-gray-200">
              {order.items.map((item) => (
                <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-16 h-16 relative">
                      {item.product?.main_image_url ? (
                        <Image
                          src={item.product.main_image_url}
                          alt={item.product?.title || 'Product'}
                          fill
                          sizes="64px"
                          className="object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-xs">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-base font-medium text-gray-900">
                            {item.product ? (
                              <Link href={`/products/${item.product.slug}`} className="hover:text-primary">
                                {item.product.title}
                              </Link>
                            ) : (
                              `Product (ID: ${item.product_id.substring(0, 8)})`
                            )}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-medium text-gray-900">
                            {formatPrice(item.total_price)}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {formatPrice(item.price_per_unit)} each
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Shipping</span>
              <span>Included</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Tax</span>
              <span>Included</span>
            </div>
            <div className="flex justify-between pt-4 border-t border-gray-200 mt-4">
              <span className="font-medium">Total</span>
              <span className="font-bold">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium mb-4">Shipping Address</h2>
            <p className="whitespace-pre-line">{order.shipping_address}</p>
          </div>

          {order.billing_address && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-medium mb-4">Billing Address</h2>
              <p className="whitespace-pre-line">{order.billing_address}</p>
            </div>
          )}
        </div>

        {order.notes && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <h2 className="text-lg font-medium mb-4">Order Notes</h2>
            <p className="whitespace-pre-line">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
