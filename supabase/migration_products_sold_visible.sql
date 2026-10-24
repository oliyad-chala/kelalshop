-- Allow approved products (both available and sold) to be viewable by everyone
-- so sold products display with a 'SOLD' badge rather than disappearing from the store.
DROP POLICY IF EXISTS "Available products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Approved products are viewable by everyone" ON products;

CREATE POLICY "Approved products are viewable by everyone"
  ON products FOR SELECT
  USING (approval_status = 'approved' OR approval_status IS NULL);
