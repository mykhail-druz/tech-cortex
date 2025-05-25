-- Add RLS policies for product_specifications table

-- Allow any authenticated user to insert product specifications
CREATE POLICY "Users can insert product specifications"
ON product_specifications FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow any authenticated user to update product specifications
CREATE POLICY "Users can update product specifications"
ON product_specifications FOR UPDATE
USING (auth.role() = 'authenticated');

-- Allow any authenticated user to delete product specifications
CREATE POLICY "Users can delete product specifications"
ON product_specifications FOR DELETE
USING (auth.role() = 'authenticated');