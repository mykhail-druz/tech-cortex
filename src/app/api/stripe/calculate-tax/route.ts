import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

// Function to normalize country names to ISO 3166-1 alpha-2 country codes
function normalizeCountryCode(country: string): string {
  // Default to US if no country is provided
  if (!country) return 'US';

  // If it's already a valid 2-character code, return it
  if (/^[A-Z]{2}$/.test(country)) return country;

  // Map of common country names to ISO codes
  const countryMap: Record<string, string> = {
    UKRAINE: 'UA',
    'UNITED STATES': 'US',
    USA: 'US',
    'UNITED KINGDOM': 'GB',
    UK: 'GB',
    RUSSIA: 'RU',
    CANADA: 'CA',
    GERMANY: 'DE',
    FRANCE: 'FR',
    ITALY: 'IT',
    SPAIN: 'ES',
    CHINA: 'CN',
    JAPAN: 'JP',
    AUSTRALIA: 'AU',
    BRAZIL: 'BR',
    INDIA: 'IN',
    // Add more mappings as needed
  };

  // Try to find the country in our map (case-insensitive)
  const normalizedName = country.toUpperCase().trim();
  if (countryMap[normalizedName]) {
    return countryMap[normalizedName];
  }

  // If we can't normalize it, log a warning and default to US
  console.warn(`Could not normalize country name: "${country}". Using default.`);
  return 'US';
}

export async function POST(request: NextRequest) {
  try {
    const { items, shippingAddress, customerDetails } = await request.json();

    // Filter out items with zero or negative prices
    const validItems = items.filter(
      (item: any) => item.price && item.price > 0 && item.quantity && item.quantity > 0
    );

    if (validItems.length === 0) {
      console.error('No valid items for tax calculation. All items have zero or negative prices.');
      return NextResponse.json(
        {
          error: 'No valid items for tax calculation',
        },
        { status: 400 }
      );
    }

    // Создаем Tax Calculation
    const taxCalculation = await stripe.tax.calculations.create({
      currency: 'usd',
      line_items: validItems.map((item: any) => {
        const amount = Math.round(item.price * item.quantity * 100); // В центах
        if (amount <= 0) {
          console.error(`Invalid amount for item ${item.product_id}: ${amount}`);
        }
        return {
          amount: amount,
          reference: item.product_id,
          tax_code: item.tax_code || 'txcd_99999999', // Общий налоговый код
        };
      }),
      customer_details: {
        address: {
          line1: shippingAddress.address,
          line2: shippingAddress.apartment || undefined,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.zipCode,
          country: normalizeCountryCode(shippingAddress.country),
        },
        address_source: 'shipping',
      },
    });

    return NextResponse.json({
      taxCalculation,
      totalTax: taxCalculation.tax_amount_exclusive,
      taxBreakdown: taxCalculation.tax_breakdown,
    });
  } catch (error) {
    console.error('Error calculating tax:', error);

    // Provide more detailed error information
    let errorMessage = 'Failed to calculate tax';
    let statusCode = 500;

    if (error instanceof Stripe.errors.StripeError) {
      errorMessage = `Stripe error: ${error.message}`;
      statusCode = error.statusCode || 500;
      console.error('Stripe error details:', {
        type: error.type,
        code: error.code,
        param: error.param,
        statusCode: error.statusCode,
      });
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
