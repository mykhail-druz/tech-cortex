-- Fix for ambiguous column reference "review_count"
-- This script updates the update_product_rating() function to properly qualify the review_count column

-- Drop existing triggers first
DROP TRIGGER IF EXISTS update_rating_on_review_insert ON reviews;
DROP TRIGGER IF EXISTS update_rating_on_review_delete ON reviews;

-- Replace the function with a fixed version
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE product_id = NEW.product_id AND is_approved = true
    ),
    "review_count" = (
      SELECT COUNT(*)
      FROM reviews
      WHERE product_id = NEW.product_id AND is_approved = true
    )
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the triggers
CREATE TRIGGER update_rating_on_review_insert
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();

CREATE TRIGGER update_rating_on_review_delete
AFTER DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();