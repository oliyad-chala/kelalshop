-- Migration: Add price_type column for products (fixed vs on_call)
-- Attributes jsonb already handles this with 100% backward compatibility,
-- but having this column allows direct SQL indexing and queries.

ALTER TABLE products ADD COLUMN IF NOT EXISTS price_type text DEFAULT 'fixed';

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_products_price_type ON products(price_type);
