-- Add is_featured column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Update existing products to not be featured by default (redundant but safe)
UPDATE products SET is_featured = false WHERE is_featured IS NULL;
