import { useState, useCallback } from 'react';

// Define types for tax calculation
export type TaxItem = {
  product_id: string;
  price: number;
  quantity: number;
  tax_code?: string;
};

export type ShippingAddress = {
  address: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

export type CustomerDetails = {
  email?: string;
  name?: string;
  phone?: string;
};

export type TaxBreakdownItem = {
  amount: number;
  tax_rate_description: string;
  tax_type_description: string;
  taxable_amount: number;
  taxable_country: string;
  taxable_state?: string;
};

export type TaxCalculationResult = {
  taxAmount: number;
  taxBreakdown: TaxBreakdownItem[];
  rawCalculation: any;
};

/**
 * Hook for calculating taxes using Stripe Tax API
 */
export const useTaxCalculation = () => {
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [taxBreakdown, setTaxBreakdown] = useState<TaxBreakdownItem[]>([]);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCalculation, setLastCalculation] = useState<TaxCalculationResult | null>(null);

  // Функция для нормализации кода страны
  const normalizeCountryCode = (country: string): string => {
    const countryMapping: { [key: string]: string } = {
      UKRAINE: 'UA',
      'UNITED STATES': 'US',
      'UNITED KINGDOM': 'GB',
      CANADA: 'CA',
      GERMANY: 'DE',
      FRANCE: 'FR',
    };

    const upperCountry = country.toUpperCase();
    return countryMapping[upperCountry] || country;
  };

  // Function to calculate taxes
  const calculateTax = useCallback(
    async (
      items: TaxItem[],
      shippingAddress: ShippingAddress,
      customerDetails?: CustomerDetails
    ): Promise<TaxCalculationResult | null> => {
      // Пропустить расчет если нет товаров или неполный адрес
      if (
        !items.length ||
        !shippingAddress.address ||
        !shippingAddress.city ||
        !shippingAddress.state ||
        !shippingAddress.zipCode
      ) {
        return null;
      }

      setIsCalculating(true);
      setError(null);

      try {
        // Нормализуем код страны
        const normalizedAddress = {
          ...shippingAddress,
          country: normalizeCountryCode(shippingAddress.country),
        };

        const response = await fetch('/api/stripe/calculate-tax', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items,
            shippingAddress: normalizedAddress,
            customerDetails,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to calculate tax');
        }

        const data = await response.json();

        const result: TaxCalculationResult = {
          taxAmount: data.totalTax / 100,
          taxBreakdown:
            data.taxBreakdown?.map((item: any) => ({
              amount: item.amount / 100,
              tax_rate_description: item.tax_rate_description,
              tax_type_description: item.tax_type_description,
              taxable_amount: item.taxable_amount / 100,
              taxable_country: item.taxable_country,
              taxable_state: item.taxable_state,
            })) || [],
          rawCalculation: data.taxCalculation,
        };

        setTaxAmount(result.taxAmount);
        setTaxBreakdown(result.taxBreakdown);
        setLastCalculation(result);

        return result;
      } catch (err) {
        console.error('Tax calculation error:', err);
        setError(err instanceof Error ? err.message : 'Failed to calculate tax');
        return null;
      } finally {
        setIsCalculating(false);
      }
    },
    []
  );

  const resetTaxCalculation = useCallback(() => {
    setTaxAmount(0);
    setTaxBreakdown([]);
    setError(null);
    setLastCalculation(null);
  }, []);

  return {
    taxAmount,
    taxBreakdown,
    isCalculating,
    error,
    calculateTax,
    resetTaxCalculation,
    lastCalculation,
  };
};
