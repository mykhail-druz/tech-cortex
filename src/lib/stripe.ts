import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil', // Use a valid API version
});

export default stripe;

/**
 * Creates a PaymentIntent for the given amount
 * @param amount - The amount to charge in cents (e.g., 1000 for $10.00)
 * @param currency - The currency to use (default: 'usd')
 * @param metadata - Additional metadata to attach to the PaymentIntent
 * @returns The created PaymentIntent
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  metadata: Record<string, string> = {}
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      // In a production environment, you might want to capture the payment later
      // capture_method: 'manual',
      payment_method_types: ['card', 'apple_pay', 'google_pay'],
    });

    return { paymentIntent, error: null };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return {
      paymentIntent: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Retrieves a PaymentIntent by ID
 * @param paymentIntentId - The ID of the PaymentIntent to retrieve
 * @returns The retrieved PaymentIntent
 */
export async function retrievePaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return { paymentIntent, error: null };
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    return {
      paymentIntent: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
