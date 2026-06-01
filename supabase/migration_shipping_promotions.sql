-- Shipping promotion columns on orders (run in Supabase SQL Editor)

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_fee numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_discount numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_promotion_id uuid REFERENCES public.promotions(id) ON DELETE SET NULL;

-- Extend create_order to accept shipping promotion (optional; app may insert directly)
CREATE OR REPLACE FUNCTION public.create_order(
  p_product_id uuid,
  p_quantity int DEFAULT 1,
  p_shipping_promotion_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product public.products%ROWTYPE;
  v_unit_price numeric;
  v_order_id uuid;
  v_base_shipping numeric := 150;
  v_shipping_fee numeric := 0;
  v_shipping_discount numeric := 0;
  v_promo public.promotions%ROWTYPE;
  v_pct numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  SELECT * INTO v_product FROM public.products WHERE id = p_product_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product not found'; END IF;
  IF NOT v_product.is_available THEN RAISE EXCEPTION 'Product is not available'; END IF;
  IF v_product.approval_status IS DISTINCT FROM 'approved' THEN
    RAISE EXCEPTION 'Product is not approved for sale';
  END IF;

  v_unit_price := coalesce(public.get_active_campaign_price(p_product_id), v_product.price);

  IF p_shipping_promotion_id IS NOT NULL THEN
    SELECT * INTO v_promo FROM public.promotions
    WHERE id = p_shipping_promotion_id
      AND type = 'shipping'
      AND is_active = true
      AND status = 'active'
      AND now() BETWEEN start_date AND end_date;

    IF FOUND THEN
      v_pct := coalesce(v_promo.discount_percentage, 0);
      v_shipping_discount := round(v_base_shipping * least(greatest(v_pct, 0), 100) / 100, 2);
      v_shipping_fee := greatest(v_base_shipping - v_shipping_discount, 0);
    END IF;
  END IF;

  INSERT INTO public.orders (
    product_id,
    buyer_id,
    shopper_id,
    amount,
    status,
    shipping_fee,
    shipping_discount,
    shipping_promotion_id
  )
  VALUES (
    p_product_id,
    auth.uid(),
    v_product.shopper_id,
    v_unit_price * p_quantity,
    'pending',
    v_shipping_fee,
    v_shipping_discount,
    CASE WHEN v_promo.id IS NOT NULL THEN p_shipping_promotion_id ELSE NULL END
  )
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order(uuid, int, uuid) TO authenticated;
