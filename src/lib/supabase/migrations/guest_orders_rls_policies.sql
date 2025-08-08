-- Row Level Security (RLS) policies for guest orders
-- This script creates policies to allow guest checkout functionality

-- Enable RLS on orders table (if not already enabled)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Allow guest order creation" ON orders;
DROP POLICY IF EXISTS "Allow guest order viewing" ON orders;

-- Policy 1: Allow authenticated users to view their own orders
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Allow authenticated users to insert their own orders
CREATE POLICY "Users can insert their own orders" ON orders
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Allow authenticated users to update their own orders
CREATE POLICY "Users can update their own orders" ON orders
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy 4: Allow guest order creation (when user_id is null and guest_email is provided)
CREATE POLICY "Allow guest order creation" ON orders
    FOR INSERT
    WITH CHECK (
        user_id IS NULL 
        AND guest_email IS NOT NULL 
        AND guest_email != ''
    );

-- Policy 5: Allow viewing guest orders by email and order ID combination
-- This is needed for the order tracking functionality
CREATE POLICY "Allow guest order viewing" ON orders
    FOR SELECT
    USING (
        user_id IS NULL 
        AND guest_email IS NOT NULL 
        AND guest_email != ''
    );

-- Policy 6: Allow system/service role to update orders (for payment processing)
CREATE POLICY "Allow service role to update orders" ON orders
    FOR UPDATE
    USING (
        -- Allow if it's a service role or if it's updating payment status
        current_setting('role') = 'service_role'
        OR (
            -- Allow updates to payment status and order status for both user and guest orders
            user_id IS NOT NULL AND auth.uid() = user_id
        )
        OR (
            -- Allow updates to guest orders for payment processing
            user_id IS NULL AND guest_email IS NOT NULL
        )
    );

-- Enable RLS on order_items table as well
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing order_items policies if they exist
DROP POLICY IF EXISTS "Users can view their order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert their order items" ON order_items;
DROP POLICY IF EXISTS "Allow guest order items viewing" ON order_items;
DROP POLICY IF EXISTS "Allow guest order items creation" ON order_items;

-- Policy for order_items: Allow viewing items for user's orders
CREATE POLICY "Users can view their order items" ON order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Policy for order_items: Allow inserting items for user's orders
CREATE POLICY "Users can insert their order items" ON order_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Policy for order_items: Allow viewing items for guest orders
CREATE POLICY "Allow guest order items viewing" ON order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id IS NULL 
            AND orders.guest_email IS NOT NULL
        )
    );

-- Policy for order_items: Allow inserting items for guest orders
CREATE POLICY "Allow guest order items creation" ON order_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id IS NULL 
            AND orders.guest_email IS NOT NULL
        )
    );

-- Grant necessary permissions to authenticated and anonymous users
GRANT SELECT, INSERT ON orders TO authenticated;
GRANT SELECT, INSERT ON orders TO anon;
GRANT SELECT, INSERT ON order_items TO authenticated;
GRANT SELECT, INSERT ON order_items TO anon;

-- Grant UPDATE permissions for payment processing
GRANT UPDATE ON orders TO authenticated;
GRANT UPDATE ON orders TO anon;

-- Comments for documentation
COMMENT ON POLICY "Allow guest order creation" ON orders IS 'Allows anonymous users to create orders with guest information';
COMMENT ON POLICY "Allow guest order viewing" ON orders IS 'Allows viewing guest orders for order tracking functionality';
COMMENT ON POLICY "Allow service role to update orders" ON orders IS 'Allows payment processing updates for both user and guest orders';