'use client';

import React, { useState } from 'react';
import { OrderWithItems, OrderStatus, PaymentStatus } from '@/lib/supabase/types/types';
import * as dbService from '@/lib/supabase/db';
import { Spinner } from '@/components/ui/Spinner';
import { FaSearch, FaCalendarAlt, FaEnvelope, FaPhone, FaUser } from 'react-icons/fa';
import Image from 'next/image';

export default function TrackOrderPage() {
  const [email, setEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOrder(null);
    setIsLoading(true);

    try {
      const { data, error } = await dbService.getGuestOrderByEmail(email, orderId);
      
      if (error || !data) {
        setError('Order not found. Please check your email and order ID.');
        return;
      }
      
      setOrder(data);
    } catch (err) {
      setError('An error occurred while searching for your order. Please try again.');
      console.error('Error tracking order:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'text-yellow-600 bg-yellow-100';
      case OrderStatus.PROCESSING:
        return 'text-blue-600 bg-blue-100';
      case OrderStatus.SHIPPED:
        return 'text-purple-600 bg-purple-100';
      case OrderStatus.DELIVERED:
        return 'text-green-600 bg-green-100';
      case OrderStatus.CANCELLED:
        return 'text-red-600 bg-red-100';
      case OrderStatus.RETURNED:
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return 'text-green-600 bg-green-100';
      case PaymentStatus.PENDING:
        return 'text-yellow-600 bg-yellow-100';
      case PaymentStatus.FAILED:
        return 'text-red-600 bg-red-100';
      case PaymentStatus.REFUNDED:
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Track Your Order</h1>
        
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <form onSubmit={handleTrackOrder} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter your email address"
                />
              </div>
              
              <div>
                <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-2">
                  Order ID *
                </label>
                <input
                  type="text"
                  id="orderId"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter your order ID"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <Spinner size="small" color="white" />
              ) : (
                <>
                  <FaSearch className="mr-2" />
                  Track Order
                </>
              )}
            </button>
          </form>
          
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>
        
        {order && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Order Header */}
            <div className="bg-gray-50 px-8 py-6 border-b">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Order #{order.id}</h2>
                  <div className="flex items-center text-gray-600 mb-2">
                    <FaCalendarAlt className="mr-2" />
                    <span>Placed on {formatDate(order.created_at)}</span>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                    Payment: {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="px-8 py-6 border-b">
              <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {order.guest_name && (
                  <div className="flex items-center">
                    <FaUser className="mr-2 text-gray-400" />
                    <span>{order.guest_name}</span>
                  </div>
                )}
                {order.guest_email && (
                  <div className="flex items-center">
                    <FaEnvelope className="mr-2 text-gray-400" />
                    <span>{order.guest_email}</span>
                  </div>
                )}
                {order.guest_phone && (
                  <div className="flex items-center">
                    <FaPhone className="mr-2 text-gray-400" />
                    <span>{order.guest_phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="px-8 py-6 border-b">
              <h3 className="text-lg font-semibold mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    {item.product?.main_image_url && (
                      <div className="flex-shrink-0">
                        <Image
                          src={item.product.main_image_url}
                          alt={item.product.title || 'Product'}
                          width={80}
                          height={80}
                          className="rounded-lg object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-grow">
                      <h4 className="font-medium text-gray-900">{item.product?.title || 'Product'}</h4>
                      <p className="text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-gray-600">Price: {formatPrice(item.price_per_unit)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(item.total_price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="px-8 py-6 border-b">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatPrice((order.total_amount || 0) - (order.tax_amount || 0))}</span>
                </div>
                {order.tax_amount && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatPrice(order.tax_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="px-8 py-6">
              <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-gray-700">{order.shipping_address}</pre>
              </div>
              {order.tracking_number && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    <strong>Tracking Number:</strong> {order.tracking_number}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}