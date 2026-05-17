-- ADDED FOR PRODUCT ATTRIBUTE SYSTEM

-- Add the flexible JSONB column for attributes
ALTER TABLE products ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;
