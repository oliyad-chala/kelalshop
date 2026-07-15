-- ============================================================
-- Fix: Allow products to be deleted even when orders reference them
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Step 1: Drop the existing foreign key constraint on orders.product_id
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_product_id_fkey;

-- Step 2: Re-add it with ON DELETE SET NULL
-- This means when a product is deleted, any orders that referenced it
-- will have product_id set to NULL instead of blocking the delete.
ALTER TABLE public.orders
  ADD CONSTRAINT orders_product_id_fkey
  FOREIGN KEY (product_id)
  REFERENCES public.products(id)
  ON DELETE SET NULL;

-- Step 3: Also ensure cart_items, wishlist_items, flash_deal_items
-- all cascade correctly (they should already, but let's be sure)

-- cart_items
ALTER TABLE public.cart_items
  DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;
ALTER TABLE public.cart_items
  ADD CONSTRAINT cart_items_product_id_fkey
  FOREIGN KEY (product_id)
  REFERENCES public.products(id)
  ON DELETE CASCADE;

-- wishlist_items
ALTER TABLE public.wishlist_items
  DROP CONSTRAINT IF EXISTS wishlist_items_product_id_fkey;
ALTER TABLE public.wishlist_items
  ADD CONSTRAINT wishlist_items_product_id_fkey
  FOREIGN KEY (product_id)
  REFERENCES public.products(id)
  ON DELETE CASCADE;

-- flash_deal_items
ALTER TABLE public.flash_deal_items
  DROP CONSTRAINT IF EXISTS flash_deal_items_product_id_fkey;
ALTER TABLE public.flash_deal_items
  ADD CONSTRAINT flash_deal_items_product_id_fkey
  FOREIGN KEY (product_id)
  REFERENCES public.products(id)
  ON DELETE CASCADE;

-- promotion_products
ALTER TABLE public.promotion_products
  DROP CONSTRAINT IF EXISTS promotion_products_product_id_fkey;
ALTER TABLE public.promotion_products
  ADD CONSTRAINT promotion_products_product_id_fkey
  FOREIGN KEY (product_id)
  REFERENCES public.products(id)
  ON DELETE CASCADE;

-- Step 4: Confirm it works — you should be able to delete a product now
-- SELECT id FROM products LIMIT 1;  -- get a test id to try
