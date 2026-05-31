-- ============================================================
-- KelalShop — Recommendations & Tracking Migration
-- ============================================================

-- 1. Track User Browsing History
create table if not exists user_product_views (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- Index for fast lookup by user and product
create index if not exists idx_user_product_views_user on user_product_views(user_id);
create index if not exists idx_user_product_views_product on user_product_views(product_id);

alter table user_product_views enable row level security;

create policy "Users can view own history"
  on user_product_views for select using (auth.uid() = user_id);

create policy "Users can insert own history"
  on user_product_views for insert with check (auth.uid() = user_id);

-- Admins can see all views
create policy "Admins can view all tracking"
  on user_product_views for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- 2. Intelligent Recommendation Engine RPC
-- Returns related products with a calculated relevance score.
create or replace function get_product_recommendations(
  p_current_product_id uuid,
  p_user_id uuid default null,
  p_limit int default 5
)
returns table (
  id uuid,
  name text,
  description text,
  price numeric,
  stock int,
  location text,
  is_available boolean,
  is_featured boolean,
  category_id uuid,
  shopper_id uuid,
  created_at timestamptz,
  relevance_score int
) language plpgsql security definer as $$
declare
  v_category_id uuid;
  v_price numeric;
begin
  -- Get base product details
  select p.category_id, p.price into v_category_id, v_price
  from products p
  where p.id = p_current_product_id;

  return query
  with scoring as (
    select
      p.id as prod_id,
      -- Category Match: 50 points
      case when p.category_id = v_category_id then 50 else 0 end +
      -- Price Proximity (within 20%): 20 points
      case when p.price between (v_price * 0.8) and (v_price * 1.2) then 20 else 0 end +
      -- User History Match (if user has viewed products in this category before): 15 points
      case when p_user_id is not null and exists (
        select 1 from user_product_views uv
        join products vp on uv.product_id = vp.id
        where uv.user_id = p_user_id and vp.category_id = p.category_id
      ) then 15 else 0 end
      as score
    from products p
    where p.id != p_current_product_id
      and p.is_available = true
      and p.approval_status = 'approved'
  )
  select
    p.id,
    p.name,
    p.description,
    p.price,
    p.stock,
    p.location,
    p.is_available,
    p.is_featured,
    p.category_id,
    p.shopper_id,
    p.created_at,
    s.score
  from products p
  join scoring s on p.id = s.prod_id
  where s.score > 0
  order by s.score desc, p.created_at desc
  limit p_limit;
end;
$$;
