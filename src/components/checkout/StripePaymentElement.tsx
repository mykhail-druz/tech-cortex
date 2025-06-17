'use client';

import React, { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

type StripePaymentElementProps = {
  clientSecret: string | null;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  isSubmitting: boolean;
  onSubmit?: (e: React.FormEvent) => Promise<boolean>; // Изменяем на async функцию, которая возвращает результат валидации
};

export default function StripePaymentElement({
  clientSecret,
  onPaymentSuccess,
  onPaymentError,
  isSubmitting,
  onSubmit,
}: StripePaymentElementProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe || !clientSecret) {
      return;
    }

    // Check the payment intent status on mount
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (paymentIntent) {
        switch (paymentIntent.status) {
          case 'succeeded':
            onPaymentSuccess(paymentIntent.id);
            break;
          case 'processing':
            setErrorMessage('Your payment is processing.');
            break;
          case 'requires_payment_method':
            // The payment was not successful, but we can try again
            setErrorMessage('Your payment was not successful, please try again.');
            break;
          default:
            setErrorMessage('Something went wrong.');
            break;
        }
      }
    });
  }, [stripe, clientSecret, onPaymentSuccess]);

  const processPayment = async () => {
    if (!stripe || !elements || !clientSecret) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        // Temporarily remove redirect URL as requested
        // confirmParams: {
        //   return_url: `${window.location.origin}/account/orders?success=true`,
        // },
        // Change to if_required to prevent automatic redirection
        redirect: 'if_required',
      });

      // This code will only run if the redirect is not immediate
      if (error) {
        // Show an error to your customer
        console.error('Payment confirmation error:', error);
        setErrorMessage(error.message || 'An unexpected error occurred.');
        onPaymentError(error.message || 'An unexpected error occurred.');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // The payment has been processed!
        console.log('Payment succeeded!');
        onPaymentSuccess(paymentIntent.id);
        // Temporarily removed redirection as requested
        // window.location.href = `${window.location.origin}/account/orders?success=true`;
      }
    } catch (err) {
      console.error('Unexpected error during payment processing:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
      onPaymentError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handlePayButtonClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    // Call onSubmit if provided to validate the form first
    if (onSubmit) {
      const isValid = await onSubmit(e as unknown as React.FormEvent);

      // Если валидация не прошла - НЕ продолжаем с платежом
      if (!isValid) {
        return;
      }

      // Add a small delay to ensure the order is created before processing payment
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Then process the payment
    await processPayment();
  };

  return (
    <div className="mt-4">
      {errorMessage && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">{errorMessage}</div>
      )}

      {clientSecret ? (
        <div>
          <PaymentElement />
          <button
            type="button"
            onClick={handlePayButtonClick}
            disabled={isLoading || isSubmitting || !stripe || !elements}
            className="w-full mt-4 bg-primary text-white py-3 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      ) : (
        <div className="animate-pulse bg-gray-200 h-40 rounded-md"></div>
      )}
    </div>
  );
}
