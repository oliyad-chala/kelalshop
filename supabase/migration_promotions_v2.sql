-- Promotions v2: description column + active campaign price helper
-- Run after migration_promotions.sql

ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS description text;

CREATE OR REPLACE FUNCTION public.get_active_campaign_price(p_product_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT pp.special_price
  FROM public.promotion_products pp
  JOIN public.promotions p ON p.id = pp.promotion_id
  WHERE pp.product_id = p_product_id
    AND pp.status = 'approved'
    AND p.is_active = true
    AND p.status = 'active'
    AND p.type = 'flash_sale_campaign'
    AND now() BETWEEN p.start_date AND p.end_date
  ORDER BY pp.special_price ASC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_campaign_price(uuid) TO anon, authenticated;
