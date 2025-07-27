'use client';

import React from 'react';
import Link from 'next/link';
import { FaCheck } from 'react-icons/fa';

export default function ThankYouPage() {
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