-- Add tax_code column to products table
ALTER TABLE products ADD COLUMN tax_code VARCHAR(50) DEFAULT 'txcd_99999999';

-- Add tax_amount column to orders table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'tax_amount'
    ) THEN
        ALTER TABLE orders ADD COLUMN tax_amount DECIMAL(10, 2) DEFAULT 0;
    END IF;
END $$;

-- Add comment to explain tax_code
COMMENT ON COLUMN products.tax_code IS 'Stripe Tax code for product tax calculation';
COMMENT ON COLUMN orders.tax_amount IS 'Tax amount calculated for the order';