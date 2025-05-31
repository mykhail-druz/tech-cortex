'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { OrderWithItems, OrderStatus, PaymentStatus } from '@/lib/supabase/types';
import Link from 'next/link';

// Order Detail Page
export default function OrderDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        // Fetch order details from the database
        const { data, error } = await import('@/lib/supabase/adminDb').then(
          module => module.getOrderDetails(id as string)
        );

        if (error) {
          throw error;
        }

        if (data) {
          setOrder(data);
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (user && id) {
      fetchOrderDetails();
    }
  }, [user, id, toast]);

  // Function to update order status
  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    try {
      // Update order status in the database
      const { data, error } = await import('@/lib/supabase/adminDb').then(
        module => module.updateOrderStatus(id as string, newStatus)
      );

      if (error) {
        throw error;
      }

      // Update it in the state
      if (order) {
        setOrder({
          ...order,
          status: newStatus,
          updated_at: new Date().toISOString()
        });
      }

      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  // Function to update payment status
  const handleUpdatePaymentStatus = async (newPaymentStatus: PaymentStatus) => {
    try {
      // Update payment status in the database
      const { data, error } = await import('@/lib/supabase/adminDb').then(
        module => module.updateOrderPaymentStatus(id as string, newPaymentStatus)
      );

      if (error) {
        throw error;
      }

      // Update it in the state
      if (order) {
        setOrder({
          ...order,
          payment_status: newPaymentStatus,
          updated_at: new Date().toISOString()
        });
      }

      toast.success(`Payment status updated to ${newPaymentStatus}`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  // Function to update tracking number
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [isUpdatingTracking, setIsUpdatingTracking] = useState(false);

  useEffect(() => {
    if (order?.tracking_number) {
      setTrackingNumber(order.tracking_number);
    }
  }, [order]);

  const handleUpdateTrackingNumber = async () => {
    try {
      setIsUpdatingTracking(true);

      // Update tracking number in the database
      const { data, error } = await import('@/lib/supabase/adminDb').then(
        module => module.updateOrderTrackingNumber(id as string, trackingNumber)
      );

      if (error) {
        throw error;
      }

      // Update it in the state
      if (order) {
        setOrder({
          ...order,
          tracking_number: trackingNumber,
          updated_at: new Date().toISOString()
        });
      }

      toast.success('Tracking number updated successfully');
    } catch (error) {
      console.error('Error updating tracking number:', error);
      toast.error('Failed to update tracking number');
    } finally {
      setIsUpdatingTracking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800">Order Not Found</h2>
        <p className="mt-2 text-gray-600">The order you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link href="/admin/orders" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Details</h1>
        <Link href="/admin/orders" className="text-blue-500 hover:text-blue-700">
          Back to Orders
        </Link>
      </div>

      {/* Order Summary */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Order ID</h3>
            <p className="mt-1 text-lg font-semibold">{order.id}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Date</h3>
            <p className="mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Customer ID</h3>
            <p className="mt-1">{order.user_id}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
            <p className="mt-1 text-lg font-semibold">${order.total_amount.toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <div className="mt-1">
              <span
                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  order.status === OrderStatus.DELIVERED
                    ? 'bg-green-100 text-green-800'
                    : order.status === OrderStatus.SHIPPED
                    ? 'bg-blue-100 text-blue-800'
                    : order.status === OrderStatus.PROCESSING
                    ? 'bg-yellow-100 text-yellow-800'
                    : order.status === OrderStatus.PENDING
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {order.status}
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Payment Status</h3>
            <div className="mt-1">
              <span
                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  order.payment_status === PaymentStatus.PAID
                    ? 'bg-green-100 text-green-800'
                    : order.payment_status === PaymentStatus.PENDING
                    ? 'bg-yellow-100 text-yellow-800'
                    : order.payment_status === PaymentStatus.REFUNDED
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {order.payment_status}
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Payment Method</h3>
            <p className="mt-1">{order.payment_method || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Tracking Number</h3>
            <div className="mt-1 flex items-center space-x-2">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full max-w-xs"
              />
              <button
                onClick={handleUpdateTrackingNumber}
                disabled={isUpdatingTracking || trackingNumber === order.tracking_number}
                className={`px-3 py-1 text-sm rounded-md ${
                  isUpdatingTracking || trackingNumber === order.tracking_number
                    ? 'bg-gray-200 text-gray-800 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isUpdatingTracking ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-500">Shipping Address</h3>
          <p className="mt-1 whitespace-pre-line">{order.shipping_address}</p>
        </div>

        {order.billing_address && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Billing Address</h3>
            <p className="mt-1 whitespace-pre-line">{order.billing_address}</p>
          </div>
        )}

        {order.notes && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Notes</h3>
            <p className="mt-1 whitespace-pre-line">{order.notes}</p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Update Order Status</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.values(OrderStatus).map((status) => (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(status as OrderStatus)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    order.status === status
                      ? 'bg-gray-200 text-gray-800 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                  disabled={order.status === status}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Update Payment Status</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.values(PaymentStatus).map((status) => (
                <button
                  key={status}
                  onClick={() => handleUpdatePaymentStatus(status as PaymentStatus)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    order.payment_status === status
                      ? 'bg-gray-200 text-gray-800 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                  disabled={order.payment_status === status}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="p-4 text-lg font-semibold border-b">Order Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {item.product?.main_image_url && (
                        <img
                          src={item.product.main_image_url}
                          alt={item.product?.title || 'Product'}
                          className="h-10 w-10 object-cover mr-3"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.product?.title || 'Product'}
                        </p>
                        <p className="text-sm text-gray-500">
                          SKU: {item.product?.sku || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${item.price_per_unit.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${item.total_price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right font-medium">
                  Total:
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-gray-900">
                  ${order.total_amount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
