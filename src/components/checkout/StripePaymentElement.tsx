'use client';

import React, { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

type StripePaymentElementProps = {
  clientSecret: string | null;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  isSubmitting: boolean;
  onSubmit?: (e: React.FormEvent) => Promise<boolean>;
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
  const [hasAttemptedPayment, setHasAttemptedPayment] = useState(false);

  useEffect(() => {
    if (!stripe || !clientSecret) {
      return;
    }

    // Check the payment intent status on the mount
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
            // Показываем ошибку только если была попытка оплаты
            // Новый PaymentIntent всегда имеет статус requires_payment_method
            if (hasAttemptedPayment) {
              setErrorMessage('Your payment was not successful, please try again.');
            }
            break;
          case 'requires_confirmation':
            // Этот статус означает, что платеж готов к подтверждению
            break;
          case 'requires_action':
            // Требуется дополнительное действие от пользователя (например, 3D Secure)
            setErrorMessage('Additional authentication is required.');
            break;
          case 'canceled':
            setErrorMessage('Payment was canceled.');
            break;
          default:
            setErrorMessage('Something went wrong.');
            break;
        }
      }
    });
  }, [stripe, clientSecret, onPaymentSuccess, hasAttemptedPayment]);

  const processPayment = async () => {
    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setHasAttemptedPayment(true); // Отмечаем, что была попытка оплаты

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment confirmation error:', error);
        setErrorMessage(error.message || 'An unexpected error occurred.');
        onPaymentError(error.message || 'An unexpected error occurred.');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded!');
        onPaymentSuccess(paymentIntent.id);
      }
    } catch (err) {
      console.error('Unexpected error during payment processing:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
      onPaymentError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayButtonClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (onSubmit) {
      const isValid = await onSubmit(e as unknown as React.FormEvent);

      if (!isValid) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

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
