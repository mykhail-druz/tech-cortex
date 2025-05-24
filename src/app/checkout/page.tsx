'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import * as dbService from '@/lib/supabase/db';
import { OrderStatus, PaymentStatus } from '@/lib/supabase/types';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentElement from '@/components/checkout/StripePaymentElement';

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
  paymentMethod: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay';
  // Card details are handled by Stripe Elements
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
  });
  const router = useRouter();

  // Redirect to cart if cart is empty
  useEffect(() => {
    if (!cartLoading && items.length === 0) {
      router.push('/cart');
    }
  }, [cartLoading, items, router]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [authLoading, user, router]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    // Handle checkbox
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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

      // Create order with payment intent ID
      const order = {
        user_id: user.id,
        status: OrderStatus.PENDING,
        total_amount: subtotal,
        shipping_address: shippingAddress,
        billing_address: billingAddress,
        payment_method: formData.paymentMethod === 'paypal' ? 'paypal' : 'stripe',
        payment_status: PaymentStatus.PENDING,
        payment_intent_id: paymentIntentId,
      };

      // Create order items
      const orderItems = items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price_per_unit: item.product?.price || 0,
        total_price: (item.product?.price || 0) * item.quantity,
      }));

      // Create order in database
      const { data: createdOrder, error: orderError } = await dbService.createOrder(order, orderItems);

      if (orderError) {
        throw new Error(`Failed to create order: ${orderError.message}`);
      }

      // The actual payment processing is handled by the StripePaymentElement component
      // We don't need to clear the cart or redirect here, as that will be handled
      // by the onPaymentSuccess callback

      // If we're using PayPal, we would handle that differently
      if (formData.paymentMethod === 'paypal') {
        // For now, just simulate a successful PayPal payment
        await clearCart();
        router.push(`/account/orders/${createdOrder?.id}?success=true`);
      }

      // For credit_card, apple_pay, and google_pay, the payment is handled by Stripe
      // The StripePaymentElement component will handle the payment and call onPaymentSuccess or onPaymentError
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  // Handle successful Stripe payment
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Update the order payment status to PAID
      // In a real application, you would have a webhook to handle this

      // Clear cart
      await clearCart();

      // Redirect to order confirmation page
      // We don't have the order ID here, so we'll redirect to the orders page
      router.push(`/account/orders?success=true`);
    } catch (err) {
      console.error('Payment success handling error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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

  if (cartLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Checkout</h1>
          <div className="bg-white rounded-lg shadow-md p-8 flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
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
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping address */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium mb-4">Shipping Address</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="apartment" className="block text-sm font-medium text-gray-700 mb-1">
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
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                        State/Province *
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP/Postal Code *
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
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
                      <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        id="billingAddress"
                        name="billingAddress"
                        value={formData.billingAddress}
                        onChange={handleInputChange}
                        required={!formData.sameAsBilling}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="billingApartment" className="block text-sm font-medium text-gray-700 mb-1">
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
                        <label htmlFor="billingCity" className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          id="billingCity"
                          name="billingCity"
                          value={formData.billingCity}
                          onChange={handleInputChange}
                          required={!formData.sameAsBilling}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        />
                      </div>
                      <div>
                        <label htmlFor="billingState" className="block text-sm font-medium text-gray-700 mb-1">
                          State/Province *
                        </label>
                        <input
                          type="text"
                          id="billingState"
                          name="billingState"
                          value={formData.billingState}
                          onChange={handleInputChange}
                          required={!formData.sameAsBilling}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        />
                      </div>
                      <div>
                        <label htmlFor="billingZipCode" className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP/Postal Code *
                        </label>
                        <input
                          type="text"
                          id="billingZipCode"
                          name="billingZipCode"
                          value={formData.billingZipCode}
                          onChange={handleInputChange}
                          required={!formData.sameAsBilling}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        />
                      </div>
                      <div>
                        <label htmlFor="billingCountry" className="block text-sm font-medium text-gray-700 mb-1">
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
                      id="apple_pay"
                      name="paymentMethod"
                      value="apple_pay"
                      checked={formData.paymentMethod === 'apple_pay'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <label htmlFor="apple_pay" className="ml-2 flex items-center text-sm text-gray-700">
                      <span>Apple Pay</span>
                      <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.6 12.9c-.1-1.2.5-2.4 1.4-3.1-.5-.7-1.3-1.3-2.2-1.6-1-.3-2.1-.3-3.1 0-.8.2-1.4.5-1.8.5-.5 0-1.1-.3-1.8-.5-1-.3-2-.2-2.9.1-1 .4-1.8 1.1-2.3 2-.8 1.4-1.2 3.5-.5 5.4.3.9.8 1.8 1.5 2.5.6.6 1.4 1.2 2.3 1.2.8 0 1.3-.3 1.9-.5.6-.2 1.1-.5 1.9-.5.8 0 1.3.3 1.9.5.6.2 1.1.5 1.9.5.9 0 1.7-.5 2.3-1.2.5-.5.9-1.1 1.2-1.8-1.1-.5-1.8-1.6-1.7-2.9zM14.9 5.5c.7-.8 1-1.9.9-3-.9.1-1.7.5-2.3 1.2-.6.7-.9 1.7-.8 2.7 1 0 1.7-.4 2.2-.9z" />
                      </svg>
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="google_pay"
                      name="paymentMethod"
                      value="google_pay"
                      checked={formData.paymentMethod === 'google_pay'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <label htmlFor="google_pay" className="ml-2 flex items-center text-sm text-gray-700">
                      <span>Google Pay</span>
                      <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 24c6.6 0 12-5.4 12-12S18.6 0 12 0 0 5.4 0 12s5.4 12 12 12z" fill="#4285F4" />
                        <path d="M12 9.5v3h4.2c-.2 1.1-1.1 3.1-4.2 3.1-2.5 0-4.6-2.1-4.6-4.6 0-2.5 2.1-4.6 4.6-4.6 1.4 0 2.4.6 2.9 1.1l2-1.9C15.4 4.2 13.8 3.5 12 3.5c-4.7 0-8.5 3.8-8.5 8.5s3.8 8.5 8.5 8.5c4.9 0 8.2-3.4 8.2-8.3 0-.6-.1-1-.1-1.5H12z" fill="#fff" />
                      </svg>
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

                  {(formData.paymentMethod === 'credit_card' || 
                    formData.paymentMethod === 'apple_pay' || 
                    formData.paymentMethod === 'google_pay') && (
                    <div className="mt-4">
                      {clientSecret ? (
                        <>
                          <StripePaymentElement
                            clientSecret={clientSecret}
                            onPaymentSuccess={handlePaymentSuccess}
                            onPaymentError={handlePaymentError}
                            isSubmitting={isSubmitting}
                          />
                          <p className="mt-2 text-xs text-gray-500">
                            Your payment information is secured by Stripe. We do not store your card details.
                          </p>
                        </>
                      ) : (
                        <div className="animate-pulse bg-gray-200 h-40 rounded-md flex items-center justify-center">
                          <p className="text-gray-500">Loading payment form...</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit button */}
              <div className="p-6">
                {formData.paymentMethod === 'paypal' && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Processing...' : 'Pay with PayPal'}
                  </button>
                )}
                {/* For credit card, the payment button is inside the StripePaymentElement */}
                <p className="mt-4 text-sm text-gray-500 text-center">
                  By placing your order, you agree to our{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Order summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h2 className="text-lg font-medium mb-4">Order Summary</h2>

              <div className="max-h-80 overflow-y-auto mb-4">
                <ul className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <li key={item.id} className="py-4 flex">
                      <div className="flex-shrink-0 w-16 h-16 relative">
                        <Image
                          src={item.product?.main_image_url || '/api/placeholder/100/100'}
                          alt={item.product?.title || 'Product'}
                          fill
                          sizes="64px"
                          className="object-contain"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {item.product?.title || 'Product'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </p>
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

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{formatPrice(subtotal * 0.1)}</span>
                </div>

                <div className="border-t border-gray-200 pt-4 flex justify-between">
                  <span className="text-lg font-medium">Total</span>
                  <span className="text-lg font-bold">{formatPrice(subtotal * 1.1)}</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/cart"
                  className="text-primary hover:text-primary/80 text-sm font-medium flex items-center"
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
