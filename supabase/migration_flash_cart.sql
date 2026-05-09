-- ============================================================
-- KelalShop — Migration: Flash Deals + Cart Items
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Flash Deals Table
create table if not exists flash_deals (
  id            uuid default uuid_generate_v4() primary key,
  product_id    uuid references products(id) on delete cascade not null,
  shopper_id    uuid references profiles(id) on delete cascade not null,
  discount_percent integer not null check (discount_percent between 5 and 90),
  ends_at       timestamptz not null,
  is_active     boolean not null default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- RLS for flash_deals
alter table flash_deals enable row level security;

create policy "Flash deals are public"
  on flash_deals for select using (true);

create policy "Shoppers can manage own flash deals"
  on flash_deals for all using (auth.uid() = shopper_id);

-- Auto-update updated_at for flash_deals
create trigger flash_deals_updated_at
  before update on flash_deals
  for each row execute function handle_updated_at();

-- ── Cart Items Table ──────────────────────────────────────────
create table if not exists cart_items (
  id            uuid default uuid_generate_v4() primary key,
  user_id       uuid references profiles(id) on delete cascade not null,
  product_id    uuid references products(id) on delete cascade not null,
  quantity      integer not null default 1 check (quantity > 0),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (user_id, product_id)
);

-- RLS for cart_items
alter table cart_items enable row level security;

create policy "Users can manage own cart"
  on cart_items for all using (auth.uid() = user_id);

-- Auto-update updated_at for cart_items
create trigger cart_items_updated_at
  before update on cart_items
  for each row execute function handle_updated_at();
