'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Initialize Stripe with the publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Default options for Elements
const defaultOptions = {
  appearance: {
    theme: 'stripe',
  },
};

// Define the context type
type StripeContextType = {
  stripe: Stripe | null;
  isLoading: boolean;
  error: string | null;
};

// Create the context with default values
const StripeContext = createContext<StripeContextType>({
  stripe: null,
  isLoading: true,
  error: null,
});

// Hook to use the Stripe context
export const useStripe = () => useContext(StripeContext);

// Props for the provider component
type StripeProviderProps = {
  children: ReactNode;
};

// Provider component
export function StripeProvider({ children }: StripeProviderProps) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const stripeInstance = await stripePromise;
        if (stripeInstance) {
          setStripe(stripeInstance);
        } else {
          setError('Failed to initialize Stripe');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred initializing Stripe');
        console.error('Stripe initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeStripe();
  }, []);

  // Provide the Stripe instance and loading state
  const value = {
    stripe,
    isLoading,
    error,
  };

  return (
    <StripeContext.Provider value={value}>
      <Elements stripe={stripePromise} options={defaultOptions}>
        {children}
      </Elements>
    </StripeContext.Provider>
  );
}
