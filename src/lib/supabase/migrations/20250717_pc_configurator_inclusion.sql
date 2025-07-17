-- Migration to add is_pc_component field to categories table
-- This field determines whether a category should be included in the PC Configurator list

-- Add the new field with a default value of false
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_pc_component BOOLEAN DEFAULT false;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_categories_is_pc_component 
ON categories(is_pc_component) 
WHERE is_pc_component = true;

-- Update existing categories that have pc_component_type to set is_pc_component to true
UPDATE categories SET 
  is_pc_component = true
WHERE pc_component_type IS NOT NULL AND pc_component_type != '';

-- Add a comment to the column for documentation
COMMENT ON COLUMN categories.is_pc_component IS 'Whether this category should be included in PC Configurator';