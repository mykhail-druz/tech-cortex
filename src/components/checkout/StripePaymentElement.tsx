'use client';

import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
  PaymentRequestButtonElement,
} from '@stripe/react-stripe-js';

type StripePaymentElementProps = {
  clientSecret: string | null;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  isSubmitting: boolean;
  onSubmit?: (e: React.FormEvent) => void;
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
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

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

  // Initialize PaymentRequest for Apple Pay and Google Pay
  useEffect(() => {
    if (!stripe || !elements || !clientSecret) {
      return;
    }

    // Get the payment intent to retrieve the amount
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) return;

      // Create PaymentRequest object with the actual amount
      const pr = stripe.paymentRequest({
        country: 'US',
        currency: paymentIntent.currency,
        total: {
          label: 'Tech Cortex Order',
          amount: paymentIntent.amount,
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      // Check if the customer can make a payment
      pr.canMakePayment().then(result => {
        if (result) {
          setPaymentRequest(pr);
          setCanMakePayment(true);
        }
      });

      // Handle payment method
      pr.on('paymentmethod', async (e) => {
        if (!clientSecret) return;

        const { error: confirmError, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: e.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) {
          e.complete('fail');
          onPaymentError(confirmError.message || 'An unexpected error occurred');
        } else if (confirmedIntent.status === 'requires_action') {
          e.complete('success');
          const { error, paymentIntent: updatedIntent } = await stripe.confirmCardPayment(clientSecret);
          if (error) {
            onPaymentError(error.message || 'An unexpected error occurred');
          } else if (updatedIntent.status === 'succeeded') {
            onPaymentSuccess(updatedIntent.id);
          }
        } else if (confirmedIntent.status === 'succeeded') {
          e.complete('success');
          onPaymentSuccess(confirmedIntent.id);
        } else {
          e.complete('fail');
          onPaymentError('Payment failed');
        }
      });
    });
  }, [stripe, elements, clientSecret, onPaymentSuccess, onPaymentError]);

  const processPayment = async () => {
    if (!stripe || !elements || !clientSecret) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Return URL where the customer should be redirected after payment
        return_url: `${window.location.origin}/account/orders?success=true`,
      },
      redirect: 'if_required',
    });

    if (error) {
      // Show error to your customer
      setErrorMessage(error.message || 'An unexpected error occurred.');
      onPaymentError(error.message || 'An unexpected error occurred.');
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // The payment has been processed!
      onPaymentSuccess(paymentIntent.id);
    }

    setIsLoading(false);
  };

  // Handle form submission
  const handlePayButtonClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await processPayment();
  };

  return (
    <div className="mt-4">
      {errorMessage && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">{errorMessage}</div>
      )}

      {clientSecret ? (
        <div>
          {canMakePayment && paymentRequest && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Express Checkout</p>
              <PaymentRequestButtonElement
                options={{
                  paymentRequest,
                  style: {
                    paymentRequestButton: {
                      theme: 'dark',
                      height: '44px',
                    },
                  },
                }}
              />
              <div className="relative flex items-center my-4">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-sm">Or pay with card</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
            </div>
          )}

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
