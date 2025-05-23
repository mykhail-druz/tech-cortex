import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { amount, currency = 'usd', metadata = {} } = body;

    // Validate the amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be a positive number.' },
        { status: 400 }
      );
    }

    // Create payment intent
    const { paymentIntent, error } = await createPaymentIntent(amount, currency, metadata);

    if (error || !paymentIntent) {
      return NextResponse.json(
        { error: error || 'Failed to create payment intent' },
        { status: 500 }
      );
    }

    // Return the client secret and payment intent ID
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error in create-payment-intent route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
