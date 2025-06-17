'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import * as dbService from '@/lib/supabase/db';
import { OrderStatus, PaymentStatus } from '@/lib/supabase/types/types';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentElement from '@/components/checkout/StripePaymentElement';
import { Spinner, ButtonSpinner } from '@/components/ui/Spinner';
import { FaCheck, FaTimes } from 'react-icons/fa';

type CheckoutFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  sameAsBilling: boolean;
  billingAddress: string;
  billingApartment: string;
  billingCity: string;
  billingState: string;
  billingZipCode: string;
  billingCountry: string;
  paymentMethod: 'credit_card' | 'paypal';
  agreeToTerms: boolean;
};

type ValidationErrors = {
  [key: string]: string;
};

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function CheckoutPage() {
  const { items, subtotal, clearCart, isLoading: cartLoading } = useCart();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [paymentCompleted, setPaymentCompleted] = useState(false); // Добавляем флаг завершения платежа
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    sameAsBilling: true,
    billingAddress: '',
    billingApartment: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    billingCountry: 'US',
    paymentMethod: 'credit_card',
    agreeToTerms: false,
  });
  const router = useRouter();

  // Redirect to cart if cart is empty BUT NOT if payment was completed
  useEffect(() => {
    if (!cartLoading && items.length === 0 && !paymentCompleted) {
      router.push('/cart');
    }
  }, [cartLoading, items, router, paymentCompleted]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      // Save cart items to session storage before redirecting
      if (items.length > 0) {
        sessionStorage.setItem('pending_cart_items', JSON.stringify(items));
      }
      router.push('/auth/login?redirect=/checkout');
    } else if (user && !authLoading) {
      // Check if there are pending cart items in session storage
      const pendingCartItems = sessionStorage.getItem('pending_cart_items');
      if (pendingCartItems) {
        try {
          const parsedItems = JSON.parse(pendingCartItems);
          // Add each item to the user's cart
          const addItemsToCart = async () => {
            for (const item of parsedItems) {
              await dbService.addToCart(user.id, item.product_id, item.quantity);
            }
            // Clear the pending items from session storage
            sessionStorage.removeItem('pending_cart_items');
            // Reload the page to refresh the cart
            window.location.reload();
          };
          addItemsToCart();
        } catch (error) {
          console.error('Error processing pending cart items:', error);
          sessionStorage.removeItem('pending_cart_items');
        }
      }
    }
  }, [authLoading, user, router, items]);

  // Pre-fill form with user profile data if available
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: user?.email || '',
        phone: profile.phone || '',
        address: profile.address_line1 || '',
        apartment: profile.address_line2 || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.postal_code || '',
        country: profile.country || 'US',
      }));
    }
  }, [profile, user]);

  // Create a payment intent when the component mounts and cart items are loaded
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!cartLoading && items.length > 0 && !clientSecret) {
        try {
          // Calculate the total amount in cents
          const amount = Math.round(subtotal * 100 * 1.1); // Including tax

          const response = await fetch('/api/stripe/create-payment-intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount,
              currency: 'usd',
              metadata: {
                user_id: user?.id || 'guest',
              },
            }),
          });

          const data = await response.json();

          if (response.ok) {
            setClientSecret(data.clientSecret);
            setPaymentIntentId(data.paymentIntentId);
          } else {
            setError(data.error || 'Failed to create payment intent');
          }
        } catch (err) {
          console.error('Error creating payment intent:', err);
          setError('Failed to initialize payment. Please try again.');
        }
      }
    };

    createPaymentIntent();
  }, [cartLoading, items, subtotal, clientSecret, user]);

  // Real-time validation
  const validateField = (name: string, value: string | boolean): string => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        return typeof value === 'string' && !value.trim() ? 'This field is required' : '';
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return typeof value === 'string' && !emailRegex.test(value)
          ? 'Please enter a valid email address'
          : '';
      case 'phone':
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        return typeof value === 'string' && !phoneRegex.test(value)
          ? 'Please enter a valid phone number'
          : '';
      case 'address':
      case 'city':
      case 'state':
      case 'zipCode':
        return typeof value === 'string' && !value.trim() ? 'This field is required' : '';
      case 'billingAddress':
      case 'billingCity':
      case 'billingState':
      case 'billingZipCode':
        if (!formData.sameAsBilling) {
          return typeof value === 'string' && !value.trim() ? 'This field is required' : '';
        }
        return '';
      case 'agreeToTerms':
        return typeof value === 'boolean' && !value
          ? 'You must agree to the terms and conditions'
          : '';
      default:
        return '';
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    // Handle checkbox
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));

      // Validate checkbox fields
      if (name === 'agreeToTerms') {
        const error = validateField(name, checked);
        setValidationErrors(prev => ({ ...prev, [name]: error }));
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    // Real-time validation for text fields
    const error = validateField(name, value);
    setValidationErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Validate required fields
    const requiredFields: (keyof CheckoutFormData)[] = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'address',
      'city',
      'state',
      'zipCode',
    ];

    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) errors[field] = error;
    });

    // Validate billing fields if different from shipping
    if (!formData.sameAsBilling) {
      const billingFields: (keyof CheckoutFormData)[] = [
        'billingAddress',
        'billingCity',
        'billingState',
        'billingZipCode',
      ];
      billingFields.forEach(field => {
        const error = validateField(field, formData[field]);
        if (error) errors[field] = error;
      });
    }

    // Validate terms agreement
    const termsError = validateField('agreeToTerms', formData.agreeToTerms);
    if (termsError) errors.agreeToTerms = termsError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Изменяем handleSubmit чтобы возвращать результат валидации
  const handleSubmit = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    setError(null);

    // Validate form before submission
    if (!validateForm()) {
      setError('Please fill in all required fields correctly');
      return false; // Возвращаем false если валидация не прошла
    }

    setIsSubmitting(true);

    try {
      if (!user) {
        throw new Error('You must be logged in to complete checkout');
      }

      // Format shipping address
      const shippingAddress = `${formData.firstName} ${formData.lastName}\n${formData.address}${
        formData.apartment ? `, ${formData.apartment}` : ''
      }\n${formData.city}, ${formData.state} ${formData.zipCode}\n${formData.country}`;

      // Format billing address
      const billingAddress = formData.sameAsBilling
        ? shippingAddress
        : `${formData.firstName} ${formData.lastName}\n${formData.billingAddress}${
            formData.billingApartment ? `, ${formData.billingApartment}` : ''
          }\n${formData.billingCity}, ${formData.billingState} ${formData.billingZipCode}\n${formData.billingCountry}`;

      // Validate payment intent ID for credit card payments
      if (formData.paymentMethod === 'credit_card' && !paymentIntentId) {
        throw new Error('Payment processing is not ready. Please try again in a moment.');
      }

      // Create order with all required fields including tracking_number and notes
      const order = {
        user_id: user.id,
        status: OrderStatus.PENDING,
        total_amount: subtotal,
        shipping_address: shippingAddress,
        billing_address: billingAddress,
        payment_method: formData.paymentMethod === 'credit_card' ? 'stripe' : 'paypal',
        payment_status: PaymentStatus.PENDING,
        payment_intent_id: paymentIntentId,
        tracking_number: null, // Will be added when order is shipped
        notes: null,
      };

      console.log('Order payment_intent_id:', paymentIntentId);

      // Create order items
      const orderItems = items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price_per_unit: item.product?.price || 0,
        total_price: (item.product?.price || 0) * item.quantity,
      }));

      console.log('Creating order with data:', { order, orderItems });

      // Create order in a database
      const { data: createdOrder, error: orderError } = await dbService.createOrder(
        order,
        orderItems
      );

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error(`Failed to create order: ${orderError.message}`);
      }

      console.log('Order created successfully:', createdOrder);

      // If we're using PayPal, we would handle that differently
      if (formData.paymentMethod === 'paypal') {
        // Set payment completed flag BEFORE clearing cart
        setPaymentCompleted(true);
        // For now, just simulate a successful PayPal payment
        await clearCart();
        console.log('PayPal payment processed successfully. Redirection disabled as requested.');
      }

      return true; // Возвращаем true если всё прошло успешно
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsSubmitting(false);
      return false; // Возвращаем false если произошла ошибка
    }
  };

  // Handle successful Stripe payment
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      console.log('Payment successful, updating order status for payment intent:', paymentIntentId);

      // Set payment completed flag BEFORE clearing cart
      setPaymentCompleted(true);

      // Log all orders to see what's in the database
      const { data: allOrders, error: ordersError } = await dbService.getUserOrders(user?.id || '');
      if (ordersError) {
        console.error('Error fetching user orders:', ordersError);
      } else {
        console.log('All user orders:', allOrders);
        if (allOrders) {
          console.log(
            'Orders with matching payment_intent_id:',
            allOrders.filter(order => order.payment_intent_id === paymentIntentId)
          );
        }
      }

      // Update the order payment status to PAID
      const { data: updatedOrder, error: updateError } = await dbService.updateOrderByPaymentIntent(
        paymentIntentId,
        {
          payment_status: PaymentStatus.PAID,
          status: OrderStatus.PROCESSING,
          user_id: user?.id,
        }
      );

      if (updateError) {
        console.error('Error updating order status:', updateError);
      } else {
        console.log('Order status updated successfully:', updatedOrder);
      }

      // Clear cart
      await clearCart();
      console.log('Payment processed successfully. Redirection disabled as requested.');
    } catch (err) {
      console.error('Payment success handling error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');

      // Even if there's an error, try to clear the cart
      try {
        // Set payment completed flag BEFORE clearing cart
        setPaymentCompleted(true);
        await clearCart();
        console.log('Cart cleared after error. Redirection disabled as requested.');
      } catch (clearErr) {
        console.error('Error clearing cart after payment:', clearErr);
      }
    }
  };

  // Handle Stripe payment error
  const handlePaymentError = (errorMessage: string) => {
    setError(`Payment failed: ${errorMessage}`);
    setIsSubmitting(false);
  };

  // Format price with currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Helper function to get field classes
  const getFieldClasses = (fieldName: string, baseClasses: string = '') => {
    const hasError = validationErrors[fieldName];
    const hasValue = formData[fieldName as keyof CheckoutFormData];

    return `${baseClasses} ${
      hasError
        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
        : hasValue && !hasError
          ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
          : 'border-gray-300 focus:ring-primary focus:border-primary'
    }`;
  };

  if (cartLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Checkout</h1>
          <div className="bg-white rounded-lg shadow-md p-8 flex justify-center items-center h-64">
            <Spinner size="large" color="primary" text="Loading checkout..." />
          </div>
        </div>
      </div>
    );
  }

  // Показываем сообщение об успешном платеже если платеж завершен
  if (paymentCompleted) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <FaCheck className="mx-auto h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
            <p className="text-lg text-gray-600 mb-8">
              Thank you for your order. Your payment has been processed successfully.
            </p>
            <div className="space-y-4">
              <Link
                href="/account/orders"
                className="inline-block bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 transition-colors"
              >
                View My Orders
              </Link>
              <div>
                <Link href="/" className="text-primary hover:text-primary/80 font-medium">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Checkout</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-6 flex items-center">
            <FaTimes className="mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Checkout form */}
          <div className="lg:w-2/3">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Contact information */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      First Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className={getFieldClasses(
                          'firstName',
                          'w-full px-3 py-2 border rounded-md focus:outline-none'
                        )}
                      />
                      {formData.firstName && !validationErrors.firstName && (
                        <FaCheck className="absolute right-3 top-3 text-green-500" />
                      )}
                    </div>
                    {validationErrors.firstName && (
                      <p className="mt-1 text-xs text-red-500">{validationErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Last Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className={getFieldClasses(
                          'lastName',
                          'w-full px-3 py-2 border rounded-md focus:outline-none'
                        )}
                      />
                      {formData.lastName && !validationErrors.lastName && (
                        <FaCheck className="absolute right-3 top-3 text-green-500" />
                      )}
                    </div>
                    {validationErrors.lastName && (
                      <p className="mt-1 text-xs text-red-500">{validationErrors.lastName}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className={getFieldClasses(
                          'email',
                          'w-full px-3 py-2 border rounded-md focus:outline-none'
                        )}
                      />
                      {formData.email && !validationErrors.email && (
                        <FaCheck className="absolute right-3 top-3 text-green-500" />
                      )}
                    </div>
                    {validationErrors.email && (
                      <p className="mt-1 text-xs text-red-500">{validationErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className={getFieldClasses(
                          'phone',
                          'w-full px-3 py-2 border rounded-md focus:outline-none'
                        )}
                      />
                      {formData.phone && !validationErrors.phone && (
                        <FaCheck className="absolute right-3 top-3 text-green-500" />
                      )}
                    </div>
                    {validationErrors.phone && (
                      <p className="mt-1 text-xs text-red-500">{validationErrors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping address */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium mb-4">Shipping Address</h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Street Address *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        className={getFieldClasses(
                          'address',
                          'w-full px-3 py-2 border rounded-md focus:outline-none'
                        )}
                      />
                      {formData.address && !validationErrors.address && (
                        <FaCheck className="absolute right-3 top-3 text-green-500" />
                      )}
                    </div>
                    {validationErrors.address && (
                      <p className="mt-1 text-xs text-red-500">{validationErrors.address}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="apartment"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Apartment, suite, etc. (optional)
                    </label>
                    <input
                      type="text"
                      id="apartment"
                      name="apartment"
                      value={formData.apartment}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="city"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        City *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                          className={getFieldClasses(
                            'city',
                            'w-full px-3 py-2 border rounded-md focus:outline-none'
                          )}
                        />
                        {formData.city && !validationErrors.city && (
                          <FaCheck className="absolute right-3 top-3 text-green-500" />
                        )}
                      </div>
                      {validationErrors.city && (
                        <p className="mt-1 text-xs text-red-500">{validationErrors.city}</p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="state"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        State/Province *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          required
                          className={getFieldClasses(
                            'state',
                            'w-full px-3 py-2 border rounded-md focus:outline-none'
                          )}
                        />
                        {formData.state && !validationErrors.state && (
                          <FaCheck className="absolute right-3 top-3 text-green-500" />
                        )}
                      </div>
                      {validationErrors.state && (
                        <p className="mt-1 text-xs text-red-500">{validationErrors.state}</p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="zipCode"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        ZIP/Postal Code *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="zipCode"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          required
                          className={getFieldClasses(
                            'zipCode',
                            'w-full px-3 py-2 border rounded-md focus:outline-none'
                          )}
                        />
                        {formData.zipCode && !validationErrors.zipCode && (
                          <FaCheck className="absolute right-3 top-3 text-green-500" />
                        )}
                      </div>
                      {validationErrors.zipCode && (
                        <p className="mt-1 text-xs text-red-500">{validationErrors.zipCode}</p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="country"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Country *
                      </label>
                      <select
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="GB">United Kingdom</option>
                        <option value="AU">Australia</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing address */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="sameAsBilling"
                    name="sameAsBilling"
                    checked={formData.sameAsBilling}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="sameAsBilling" className="ml-2 block text-sm text-gray-700">
                    Billing address is the same as shipping address
                  </label>
                </div>

                {!formData.sameAsBilling && (
                  <div className="space-y-4 mt-4">
                    <h2 className="text-lg font-medium mb-4">Billing Address</h2>
                    <div>
                      <label
                        htmlFor="billingAddress"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Street Address *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="billingAddress"
                          name="billingAddress"
                          value={formData.billingAddress}
                          onChange={handleInputChange}
                          required={!formData.sameAsBilling}
                          className={getFieldClasses(
                            'billingAddress',
                            'w-full px-3 py-2 border rounded-md focus:outline-none'
                          )}
                        />
                        {formData.billingAddress && !validationErrors.billingAddress && (
                          <FaCheck className="absolute right-3 top-3 text-green-500" />
                        )}
                      </div>
                      {validationErrors.billingAddress && (
                        <p className="mt-1 text-xs text-red-500">
                          {validationErrors.billingAddress}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="billingApartment"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Apartment, suite, etc. (optional)
                      </label>
                      <input
                        type="text"
                        id="billingApartment"
                        name="billingApartment"
                        value={formData.billingApartment}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="billingCity"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          City *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="billingCity"
                            name="billingCity"
                            value={formData.billingCity}
                            onChange={handleInputChange}
                            required={!formData.sameAsBilling}
                            className={getFieldClasses(
                              'billingCity',
                              'w-full px-3 py-2 border rounded-md focus:outline-none'
                            )}
                          />
                          {formData.billingCity && !validationErrors.billingCity && (
                            <FaCheck className="absolute right-3 top-3 text-green-500" />
                          )}
                        </div>
                        {validationErrors.billingCity && (
                          <p className="mt-1 text-xs text-red-500">
                            {validationErrors.billingCity}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="billingState"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          State/Province *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="billingState"
                            name="billingState"
                            value={formData.billingState}
                            onChange={handleInputChange}
                            required={!formData.sameAsBilling}
                            className={getFieldClasses(
                              'billingState',
                              'w-full px-3 py-2 border rounded-md focus:outline-none'
                            )}
                          />
                          {formData.billingState && !validationErrors.billingState && (
                            <FaCheck className="absolute right-3 top-3 text-green-500" />
                          )}
                        </div>
                        {validationErrors.billingState && (
                          <p className="mt-1 text-xs text-red-500">
                            {validationErrors.billingState}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="billingZipCode"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          ZIP/Postal Code *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="billingZipCode"
                            name="billingZipCode"
                            value={formData.billingZipCode}
                            onChange={handleInputChange}
                            required={!formData.sameAsBilling}
                            className={getFieldClasses(
                              'billingZipCode',
                              'w-full px-3 py-2 border rounded-md focus:outline-none'
                            )}
                          />
                          {formData.billingZipCode && !validationErrors.billingZipCode && (
                            <FaCheck className="absolute right-3 top-3 text-green-500" />
                          )}
                        </div>
                        {validationErrors.billingZipCode && (
                          <p className="mt-1 text-xs text-red-500">
                            {validationErrors.billingZipCode}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="billingCountry"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Country *
                        </label>
                        <select
                          id="billingCountry"
                          name="billingCountry"
                          value={formData.billingCountry}
                          onChange={handleInputChange}
                          required={!formData.sameAsBilling}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        >
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="GB">United Kingdom</option>
                          <option value="AU">Australia</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment method */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium mb-4">Payment Method</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="credit_card"
                      name="paymentMethod"
                      value="credit_card"
                      checked={formData.paymentMethod === 'credit_card'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <label htmlFor="credit_card" className="ml-2 block text-sm text-gray-700">
                      Credit Card
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="paypal"
                      name="paymentMethod"
                      value="paypal"
                      checked={formData.paymentMethod === 'paypal'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <label htmlFor="paypal" className="ml-2 block text-sm text-gray-700">
                      PayPal
                    </label>
                  </div>

                  {formData.paymentMethod === 'credit_card' && (
                    <div className="mt-4">
                      {clientSecret ? (
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                          <StripePaymentElement
                            clientSecret={clientSecret}
                            onPaymentSuccess={handlePaymentSuccess}
                            onPaymentError={handlePaymentError}
                            isSubmitting={isSubmitting}
                            onSubmit={handleSubmit}
                          />
                        </Elements>
                      ) : (
                        <div className="animate-pulse bg-gray-200 h-40 rounded-md flex items-center justify-center">
                          <p className="text-gray-500">Loading payment form...</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Terms and submit */}
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="agreeToTerms"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mt-0.5"
                    />
                    <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
                      I agree to the{' '}
                      <Link href="/terms" className="text-primary hover:underline" target="_blank">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link
                        href="/privacy"
                        className="text-primary hover:underline"
                        target="_blank"
                      >
                        Privacy Policy
                      </Link>{' '}
                      *
                    </label>
                  </div>
                  {validationErrors.agreeToTerms && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors.agreeToTerms}</p>
                  )}
                </div>

                {formData.paymentMethod === 'paypal' && (
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.agreeToTerms}
                    className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <ButtonSpinner color="white" buttonText="Processing..." />
                    ) : (
                      `Pay ${formatPrice(subtotal * 1.1)} with PayPal`
                    )}
                  </button>
                )}
                {/* For credit card, the payment button is inside the StripePaymentElement */}
              </div>
            </form>
          </div>

          {/* Order summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h2 className="text-lg font-medium mb-4">Order Summary</h2>

              <div className="max-h-80 overflow-y-auto mb-4">
                <ul className="divide-y divide-gray-200">
                  {items.map(item => (
                    <li key={item.id} className="py-4 flex">
                      <div className="flex-shrink-0 w-16 h-16 relative">
                        <Image
                          src={item.product?.main_image_url || '/api/placeholder/100/100'}
                          alt={item.product?.title || 'Product'}
                          fill
                          sizes="64px"
                          className="object-contain rounded"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {item.product?.title || 'Product'}
                        </h3>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatPrice((item.product?.price || 0) * item.quantity)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{formatPrice(subtotal * 0.1)}</span>
                </div>

                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(subtotal * 1.1)}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/cart"
                  className="text-primary hover:text-primary/80 text-sm font-medium flex items-center justify-center"
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Return to Cart
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
