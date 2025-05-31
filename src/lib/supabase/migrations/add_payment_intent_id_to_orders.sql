-- Add payment_intent_id column to orders table
ALTER TABLE orders ADD COLUMN payment_intent_id TEXT;

-- Comment on the column
COMMENT ON COLUMN orders.payment_intent_id IS 'The Stripe payment intent ID associated with this order';