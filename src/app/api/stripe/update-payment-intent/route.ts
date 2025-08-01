import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, amount, metadata } = await request.json();
    
    // Validate required parameters
    if (!paymentIntentId || !amount) {
      return NextResponse.json(
        { error: 'PaymentIntent ID and amount are required' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than zero' },
        { status: 400 }
      );
    }

    console.log('Updating PaymentIntent:', {
      paymentIntentId,
      amount,
      metadata,
    });

    // Update the existing PaymentIntent
    const updatedPaymentIntent = await stripe.paymentIntents.update(
      paymentIntentId,
      {
        amount,
        metadata: {
          ...metadata,
          updated_at: new Date().toISOString(),
        },
      }
    );
    
    console.log('PaymentIntent updated successfully:', {
      id: updatedPaymentIntent.id,
      amount: updatedPaymentIntent.amount,
      status: updatedPaymentIntent.status,
    });

    return NextResponse.json({
      success: true,
      paymentIntent: {
        id: updatedPaymentIntent.id,
        amount: updatedPaymentIntent.amount,
        status: updatedPaymentIntent.status,
        client_secret: updatedPaymentIntent.client_secret,
      },
    });
  } catch (error) {
    console.error('Error updating PaymentIntent:', error);
    
    // Handle Stripe-specific errors
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as {
        message: string;
        type: string;
        code?: string;
        statusCode?: number;
      };
      return NextResponse.json(
        { 
          error: `Stripe error: ${stripeError.message}`,
          type: stripeError.type,
          code: stripeError.code,
        },
        { status: stripeError.statusCode || 500 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}