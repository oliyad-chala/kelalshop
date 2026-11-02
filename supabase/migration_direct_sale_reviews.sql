-- ==============================================================================
-- Migration: Direct Sale Reviews (Phone, Telegram, In-App Chat, In-Person)
-- Allows buyers who transact directly/offline to review and rate shoppers
-- ==============================================================================

-- 1. Make order_id nullable so offline direct sales can be reviewed
ALTER TABLE reviews ALTER COLUMN order_id DROP NOT NULL;

-- 2. Add product_id, channel, and review tags to reviews table
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS channel TEXT CHECK (channel IN ('phone', 'telegram', 'in_app_chat', 'order', 'in_person', 'other')) DEFAULT 'phone',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 3. Create indexes for quick lookups and aggregated ratings
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);

-- 4. Update the trust score calculation trigger to run on INSERT, UPDATE, or DELETE
CREATE OR REPLACE FUNCTION update_trust_score()
RETURNS TRIGGER AS $$
DECLARE
  target_id UUID;
BEGIN
  target_id := COALESCE(NEW.reviewee_id, OLD.reviewee_id);

  UPDATE profiles
  SET trust_score = (
    SELECT COALESCE(ROUND(AVG(rating)::NUMERIC * 20, 0)::INTEGER, 0)
    FROM reviews
    WHERE reviewee_id = target_id
  )
  WHERE id = target_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_review_created ON reviews;
DROP TRIGGER IF EXISTS trg_reviews_update_trust_score ON reviews;

CREATE TRIGGER trg_reviews_update_trust_score
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_trust_score();

-- 5. Update RLS policies to allow direct sale reviews
DROP POLICY IF EXISTS "Users can write reviews for completed orders" ON reviews;
DROP POLICY IF EXISTS "Users can write reviews" ON reviews;

CREATE POLICY "Users can write reviews"
  ON reviews FOR INSERT WITH CHECK (
    -- Must be authenticated and reviewer must be the current user
    auth.uid() = reviewer_id
    -- Cannot review yourself
    AND reviewer_id <> reviewee_id
    -- If order_id is provided, must be a delivered order between reviewer and reviewee
    AND (
      order_id IS NULL
      OR EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = order_id
          AND o.buyer_id = auth.uid()
          AND o.shopper_id = reviewee_id
          AND o.status = 'delivered'
      )
    )
  );

