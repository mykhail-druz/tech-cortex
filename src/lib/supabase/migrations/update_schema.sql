-- Update Categories Table to support subcategories
ALTER TABLE categories ADD COLUMN parent_id UUID REFERENCES categories(id);
ALTER TABLE categories ADD COLUMN is_subcategory BOOLEAN DEFAULT FALSE;

-- Update Products Table to support subcategories
ALTER TABLE products ADD COLUMN subcategory_id UUID REFERENCES categories(id);

-- Add indexes for better performance
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_is_subcategory ON categories(is_subcategory);
CREATE INDEX idx_products_subcategory_id ON products(subcategory_id);

-- Update existing categories to set is_subcategory = FALSE
UPDATE categories SET is_subcategory = FALSE WHERE is_subcategory IS NULL;