-- Migration to add icon_url field to categories table
ALTER TABLE categories ADD COLUMN icon_url TEXT;

-- Update existing categories to set icon_url to null
UPDATE categories SET icon_url = NULL;