-- Buyer order creation with campaign-aware pricing (run in Supabase SQL Editor)
-- Safe to re-run: replaces function if it already exists

CREATE OR REPLACE FUNCTION public.create_order(
  p_product_id uuid,
  p_quantity int DEFAULT 1
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
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  SELECT * INTO v_product
  FROM public.products
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF NOT v_product.is_available THEN
    RAISE EXCEPTION 'Product is not available';
  END IF;

  IF v_product.approval_status IS DISTINCT FROM 'approved' THEN
    RAISE EXCEPTION 'Product is not approved for sale';
  END IF;

  v_unit_price := COALESCE(
    public.get_active_campaign_price(p_product_id),
    v_product.price
  );

  INSERT INTO public.orders (
    product_id,
    buyer_id,
    shopper_id,
    amount,
    status
  )
  VALUES (
    p_product_id,
    auth.uid(),
    v_product.shopper_id,
    v_unit_price * p_quantity,
    'pending'
  )
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order(uuid, int) TO authenticated;
