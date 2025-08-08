-- Migration script to add guest order support
-- This script modifies the orders table to support guest purchases

-- Step 1: Make user_id nullable to allow guest orders
ALTER TABLE orders 
ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Add guest information fields
ALTER TABLE orders 
ADD COLUMN guest_email VARCHAR(255),
ADD COLUMN guest_phone VARCHAR(20),
ADD COLUMN guest_name VARCHAR(255);

-- Step 3: Add constraint to ensure either user_id or guest_email is provided
ALTER TABLE orders 
ADD CONSTRAINT check_user_or_guest 
CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL);

-- Step 4: Add index on guest_email for faster guest order lookups
CREATE INDEX idx_orders_guest_email ON orders(guest_email) WHERE guest_email IS NOT NULL;

-- Step 5: Add index on combination of guest_email and id for order tracking
CREATE INDEX idx_orders_guest_tracking ON orders(guest_email, id) WHERE guest_email IS NOT NULL;

-- Optional: Add comments to document the new fields
COMMENT ON COLUMN orders.guest_email IS 'Email address for guest orders (required when user_id is null)';
COMMENT ON COLUMN orders.guest_phone IS 'Phone number for guest orders';
COMMENT ON COLUMN orders.guest_name IS 'Full name for guest orders';