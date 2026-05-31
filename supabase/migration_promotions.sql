-- ============================================================
-- KelalShop — Geo-Targeted Promotions & Campaigns Migration
-- ============================================================

-- Promotion Status Enum
create type promotion_status as enum ('upcoming', 'active', 'ended');
create type promotion_type as enum ('banner', 'flash_sale_campaign', 'shipping');
create type promotion_product_status as enum ('pending', 'approved', 'rejected');

-- Promotions Table (Admin Campaigns)
create table if not exists promotions (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type promotion_type not null default 'flash_sale_campaign',
  target_country text, -- null means global
  target_region text,
  target_city text,
  banner_image_url text,
  discount_percentage numeric(5,2),
  start_date timestamptz not null,
  end_date timestamptz not null,
  status promotion_status default 'upcoming',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Promotion Products (Seller Opt-ins)
create table if not exists promotion_products (
  promotion_id uuid references promotions(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  shopper_id uuid references profiles(id) on delete cascade not null,
  special_price numeric(10,2) not null check (special_price >= 0),
  status promotion_product_status default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (promotion_id, product_id)
);

-- Auto-update triggers
create trigger promotions_updated_at
  before update on promotions
  for each row execute function handle_updated_at();

create trigger promotion_products_updated_at
  before update on promotion_products
  for each row execute function handle_updated_at();

-- RLS
alter table promotions enable row level security;
alter table promotion_products enable row level security;

-- Promotions RLS
-- Anyone can read active promotions
create policy "Promotions viewable by everyone"
  on promotions for select using (is_active = true);

-- Admins can do everything on promotions
create policy "Admins manage promotions"
  on promotions for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Promotion Products RLS
-- Anyone can view approved promotion products
create policy "Approved promotion products viewable by everyone"
  on promotion_products for select using (status = 'approved');

-- Shoppers can view their own pending/rejected/approved promotion products
create policy "Shoppers can view their own promotion products"
  on promotion_products for select using (shopper_id = auth.uid());

-- Shoppers can opt-in (insert) their own products
create policy "Shoppers can opt-in own products"
  on promotion_products for insert with check (
    shopper_id = auth.uid()
    and auth.uid() = (select shopper_id from products where id = product_id)
  );

-- Shoppers can update their pending opt-ins (e.g. change price before approval)
create policy "Shoppers can update own pending opt-ins"
  on promotion_products for update using (
    shopper_id = auth.uid() and status = 'pending'
  );

-- Shoppers can delete their own opt-ins
create policy "Shoppers can delete own opt-ins"
  on promotion_products for delete using (
    shopper_id = auth.uid()
  );

-- Admins can manage all promotion products
create policy "Admins manage promotion products"
  on promotion_products for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
