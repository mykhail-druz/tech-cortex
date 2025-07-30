'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { Spinner } from '@/components/ui/Spinner';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function CartPage() {
  const { items, itemCount, subtotal, updateItemQuantity, removeItem, clearCart, isLoading } =
    useCart();
  const [isProcessing] = useState(false); // setIsProcessing is not used
  const router = useRouter();

  // Modal states
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [showRemoveItemModal, setShowRemoveItemModal] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > 100) return;
    await updateItemQuantity(itemId, newQuantity);
  };

  const handleQuantityInputChange = async (itemId: string, value: string) => {
    const newQuantity = parseInt(value);
    if (isNaN(newQuantity) || newQuantity < 1 || newQuantity > 100) return;
    await updateItemQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId: string) => {
    setItemToRemove(itemId);
    setShowRemoveItemModal(true);
  };

  const confirmRemoveItem = async () => {
    if (itemToRemove) {
      setIsRemoving(true);
      await removeItem(itemToRemove);
      setIsRemoving(false);
      setShowRemoveItemModal(false);
      setItemToRemove(null);
    }
  };

  const handleClearCart = () => {
    setShowClearCartModal(true);
  };

  const confirmClearCart = async () => {
    setIsClearing(true);
    await clearCart();
    setIsClearing(false);
    setShowClearCartModal(false);
  };

  const handleCheckout = () => {
    // Allow both authenticated users and guests to proceed to checkout
    // The checkout page will handle the choice between login and guest checkout
    router.push('/checkout');
  };

  // Format price with currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Your Cart</h1>
          <div className="bg-white rounded-lg shadow-md p-8 flex justify-center items-center h-64">
            <Spinner size="large" color="primary" text="Loading your cart..." />
          </div>
        </div>
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Your Cart</h1>
          <div className="bg-white rounded-lg shadow-md p-8 text-center border">
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
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h2 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">
              Looks like you haven&apos;t added any products to your cart yet.
            </p>
            <Link
              href="/products"
              className="inline-block bg-primary text-white py-2 px-6 rounded-md hover:bg-primary/90 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Your Cart</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart items */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-lg shadow-md border overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium">
                    {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
                  </h2>
                  <button
                    onClick={handleClearCart}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>

              <ul className="divide-y divide-gray-200">
                {items.map(item => (
                  <li key={item.id} className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row">
                      {/* Product image */}
                      <div className="flex-shrink-0 w-full sm:w-24 h-24 mb-4 sm:mb-0 relative">
                        <div className="relative h-full w-full">
                          <Image
                            src={item.product?.main_image_url || '/api/placeholder/100/100'}
                            alt={item.product?.title || 'Product'}
                            fill
                            sizes="(max-width: 768px) 100vw, 100px"
                            className="object-contain"
                          />
                        </div>
                      </div>

                      {/* Product details */}
                      <div className="flex-1 sm:ml-6">
                        <div className="flex flex-col sm:flex-row justify-between">
                          <div>
                            <h3 className="text-base font-medium text-gray-900">
                              <Link
                                href={`/products/${item.product?.slug || item.product_id}`}
                                className="hover:text-primary"
                              >
                                {item.product?.title || 'Product'}
                              </Link>
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {item.product?.brand || 'Brand'}
                            </p>
                          </div>
                          <div className="mt-2 sm:mt-0 text-right">
                            <p className="text-base font-medium text-gray-900">
                              {formatPrice((item.product?.price || 0) * item.quantity)}
                            </p>
                            {item.product?.old_price && (
                              <p className="text-sm text-gray-500 line-through">
                                {formatPrice((item.product.old_price || 0) * item.quantity)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex justify-between items-center">
                          {/* Quantity selector */}
                          <div className="flex items-center border border-gray-300 rounded-md">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="flex-shrink-0 px-3 py-1 text-gray-600 hover:bg-gray-100 focus:outline-none"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={item.quantity}
                              onChange={e => handleQuantityInputChange(item.id, e.target.value)}
                              className="w-16 px-3 py-1 border-x border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                            />
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="flex-shrink-0 px-3 py-1 text-gray-600 hover:bg-gray-100 focus:outline-none"
                            >
                              +
                            </button>
                          </div>

                          {/* Remove button */}
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-red-100 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="p-4 border-t border-gray-200">
                <Link
                  href="/products"
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
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-md border p-6 sticky top-20">
              <h2 className="text-lg font-medium mb-6">Order Summary</h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>

                <div className="border-t border-gray-200 pt-4 flex justify-between">
                  <span className="text-lg font-medium">Total</span>
                  <span className="text-lg font-bold">{formatPrice(subtotal)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full mt-6 bg-primary text-white py-3 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
              </button>

              {/*{!user && (*/}
              {/*  <p className="mt-4 text-sm text-gray-500 text-center">*/}
              {/*    You&apos;ll need to sign in to complete your purchase*/}
              {/*  </p>*/}
              {/*)}*/}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showClearCartModal}
        onClose={() => setShowClearCartModal(false)}
        onConfirm={confirmClearCart}
        title="Clear Cart"
        message="Are you sure you want to clear your cart? This action cannot be undone and all items will be removed."
        confirmText="Clear Cart"
        cancelText="Cancel"
        confirmButtonClass="bg-red-500 hover:bg-red-600 text-white"
        isLoading={isClearing}
      />

      <ConfirmationModal
        isOpen={showRemoveItemModal}
        onClose={() => {
          setShowRemoveItemModal(false);
          setItemToRemove(null);
        }}
        onConfirm={confirmRemoveItem}
        title="Remove Item"
        message={`Are you sure you want to remove this item from your cart?`}
        confirmText="Remove"
        cancelText="Cancel"
        confirmButtonClass="bg-red-500 hover:bg-red-600 text-white"
        isLoading={isRemoving}
      />
    </div>
  );
}
