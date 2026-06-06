-- ============================================================
-- KelalShop — Full Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================
create type user_role as enum ('buyer', 'shopper', 'admin', 'staff');
create type verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type order_status as enum ('pending', 'accepted', 'shipped', 'delivered', 'cancelled', 'disputed');
create type request_status as enum ('open', 'assigned', 'completed', 'cancelled');
create type payment_request_status as enum ('pending', 'approved', 'rejected');

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (extends auth.users 1:1)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  location text,
  phone text,
  role user_role not null default 'buyer',
  trust_score integer default 0 check (trust_score >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Shopper Profiles (1:1 with verified shoppers)
create table shopper_profiles (
  id uuid references profiles(id) on delete cascade primary key,
  bio text,
  id_document_url text,
  id_document_back_url text,
  verification_status verification_status default 'unverified',
  business_name text,
  delivery_time_days integer default 14,
  min_order_amount numeric(10,2) default 0,
  total_orders integer default 0,
  is_top_shopper boolean default false,
  -- Removed financial/escrow columns
  agreed_to_terms boolean not null default false,
  subscription_plan text default 'free',
  subscription_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Categories
create table categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  icon text,
  created_at timestamptz default now()
);

-- Import Sources
create table import_sources (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  logo_url text,
  created_at timestamptz default now()
);

-- Shopper ↔ Categories (join)
create table shopper_categories (
  shopper_id uuid references shopper_profiles(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  primary key (shopper_id, category_id)
);

-- Shopper ↔ Import Sources (join)
create table shopper_sources (
  shopper_id uuid references shopper_profiles(id) on delete cascade,
  source_id uuid references import_sources(id) on delete cascade,
  primary key (shopper_id, source_id)
);

-- Products
create table products (
  id uuid default uuid_generate_v4() primary key,
  shopper_id uuid references profiles(id) on delete cascade not null,
  category_id uuid references categories(id),
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  stock integer default 0 check (stock >= 0),
  location text,
  is_available boolean default true,
  source_url text,
  is_featured boolean default false,
  boosted_until timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Product Images
create table product_images (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade not null,
  url text not null,
  is_primary boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Requests (buyer requests a specific item)
create table requests (
  id uuid default uuid_generate_v4() primary key,
  buyer_id uuid references profiles(id) on delete cascade not null,
  shopper_id uuid references profiles(id),
  category_id uuid references categories(id),
  title text not null,
  description text not null,
  source_url text,
  budget numeric(10,2),
  status request_status default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Orders (escrow-ready)
create table orders (
  id uuid default uuid_generate_v4() primary key,
  request_id uuid references requests(id),
  product_id uuid references products(id),
  buyer_id uuid references profiles(id) not null,
  shopper_id uuid references profiles(id) not null,
  amount numeric(10,2) not null check (amount >= 0),
  status order_status default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Reviews
create table reviews (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade,
  reviewer_id uuid references profiles(id) not null,
  reviewee_id uuid references profiles(id) not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamptz default now()
);

-- Messages (realtime chat)
create table messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references profiles(id) not null,
  recipient_id uuid references profiles(id) not null,
  order_id uuid references orders(id),
  request_id uuid references requests(id),
  content text not null,
  image_url text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Payment Requests (Admin Manual Verification)
create table payment_requests (
  id uuid default uuid_generate_v4() primary key,
  shopper_id uuid references profiles(id) on delete cascade not null,
  payment_type text not null, -- 'pro_subscription', 'boost_7_days', 'boost_28_days', 'banner_ad'
  target_id uuid, -- optional product_id if boosting
  amount numeric(10,2) not null check (amount >= 0),
  reference_number text not null,
  status payment_request_status default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function handle_updated_at();

create trigger shopper_profiles_updated_at
  before update on shopper_profiles
  for each row execute function handle_updated_at();

create trigger products_updated_at
  before update on products
  for each row execute function handle_updated_at();

create trigger requests_updated_at
  before update on requests
  for each row execute function handle_updated_at();

create trigger orders_updated_at
  before update on orders
  for each row execute function handle_updated_at();

create trigger payment_requests_updated_at
  before update on payment_requests
  for each row execute function handle_updated_at();

create or replace function public.handle_new_user()
returns trigger
set search_path = ''
as $$
declare
  _role text;
begin
  _role := coalesce(new.raw_user_meta_data->>'role', 'buyer');
  if _role not in ('buyer', 'shopper') then
    _role := 'buyer';
  end if;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    _role::public.user_role
  );

  -- If role is shopper, also create shopper_profile
  if _role = 'shopper' then
    insert into public.shopper_profiles (id)
    values (new.id);
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Update trust score when review is added
create or replace function update_trust_score()
returns trigger as $$
begin
  update profiles
  set trust_score = (
    select coalesce(round(avg(rating)::numeric * 20, 0)::integer, 0)
    from reviews
    where reviewee_id = new.reviewee_id
  )
  where id = new.reviewee_id;
  return new;
end;
$$ language plpgsql;

create trigger on_review_created
  after insert on reviews
  for each row execute function update_trust_score();

-- Prevent users from escalating role or trust_score via direct updates
create or replace function protect_profile_sensitive_columns()
returns trigger as $$
begin
  if tg_op = 'UPDATE' then
    if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
      new.role := old.role;
      new.trust_score := old.trust_score;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger protect_profiles_sensitive
  before update on profiles
  for each row execute function protect_profile_sensitive_columns();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table shopper_profiles enable row level security;
alter table categories enable row level security;
alter table import_sources enable row level security;
alter table shopper_categories enable row level security;
alter table shopper_sources enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table requests enable row level security;
alter table orders enable row level security;
alter table reviews enable row level security;
alter table messages enable row level security;
alter table payment_requests enable row level security;

-- Profiles
create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Shopper Profiles
create policy "Shopper profiles are viewable by everyone"
  on shopper_profiles for select using (true);

create policy "Shoppers can insert own profile"
  on shopper_profiles for insert with check (auth.uid() = id);

create policy "Shoppers can update own profile"
  on shopper_profiles for update using (auth.uid() = id);

-- Categories (public read)
create policy "Categories are viewable by everyone"
  on categories for select using (true);

-- Import Sources (public read)
create policy "Import sources are viewable by everyone"
  on import_sources for select using (true);

-- Shopper Categories
create policy "Shopper categories are viewable by everyone"
  on shopper_categories for select using (true);

create policy "Shoppers can manage own categories"
  on shopper_categories for all using (auth.uid() = shopper_id);

-- Shopper Sources
create policy "Shopper sources are viewable by everyone"
  on shopper_sources for select using (true);

create policy "Shoppers can manage own sources"
  on shopper_sources for all using (auth.uid() = shopper_id);

-- Products
create policy "Available products are viewable by everyone"
  on products for select using (is_available = true);

create policy "Shoppers can view own unavailable products"
  on products for select using (auth.uid() = shopper_id);

create policy "Shoppers can create products"
  on products for insert with check (auth.uid() = shopper_id);

create policy "Shoppers can update own products"
  on products for update using (auth.uid() = shopper_id);

create policy "Shoppers can delete own products"
  on products for delete using (auth.uid() = shopper_id);

-- Product Images
create policy "Product images are viewable by everyone"
  on product_images for select using (true);

create policy "Shoppers can manage own product images"
  on product_images for all using (
    auth.uid() = (select shopper_id from products where id = product_id)
  );

-- Requests
create policy "Open requests visible to everyone authenticated"
  on requests for select using (
    status = 'open'
    or auth.uid() = buyer_id
    or auth.uid() = shopper_id
  );

create policy "Buyers can create requests"
  on requests for insert with check (auth.uid() = buyer_id);

create policy "Buyers can update own requests"
  on requests for update using (auth.uid() = buyer_id);

-- Orders
create policy "Orders visible to buyer and shopper only"
  on orders for select using (
    auth.uid() = buyer_id or auth.uid() = shopper_id
  );

create policy "Shoppers can create orders"
  on orders for insert with check (auth.uid() = shopper_id);

create policy "Buyer and shopper can update orders"
  on orders for update using (
    auth.uid() = buyer_id or auth.uid() = shopper_id
  );

-- Reviews
create policy "Reviews are public"
  on reviews for select using (true);

create policy "Users can write reviews for completed orders"
  on reviews for insert with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from orders o
      where o.id = order_id
        and o.buyer_id = auth.uid()
        and o.status = 'delivered'
        and o.shopper_id = reviewee_id
    )
  );

-- Messages
create policy "Messages visible to sender and recipient"
  on messages for select using (
    auth.uid() = sender_id or auth.uid() = recipient_id
  );

create policy "Authenticated users can send messages"
  on messages for insert with check (auth.uid() = sender_id);

create policy "Recipients can mark messages as read"
  on messages for update using (auth.uid() = recipient_id);

-- Payment Requests
create policy "Shoppers can view own payment requests"
  on payment_requests for select using (auth.uid() = shopper_id);

create policy "Shoppers can insert own payment requests"
  on payment_requests for insert with check (auth.uid() = shopper_id);

-- Admins handle update/select all via service role or admin RLS
create policy "Admins view all payment requests"
  on payment_requests for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins update all payment requests"
  on payment_requests for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('products', 'products', true),
  ('id-documents', 'id-documents', false),
  ('messages', 'messages', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Avatar images are publicly accessible"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Authenticated users can upload avatars"
  on storage.objects for insert with check (
    bucket_id = 'avatars' and auth.uid() is not null
  );

create policy "Users can update own avatar"
  on storage.objects for update using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Product images are publicly accessible"
  on storage.objects for select using (bucket_id = 'products');

create policy "Authenticated users can upload product images"
  on storage.objects for insert with check (
    bucket_id = 'products' and auth.uid() is not null
  );

create policy "Message images are publicly accessible"
  on storage.objects for select using (bucket_id = 'messages');

create policy "Authenticated users can upload message images"
  on storage.objects for insert with check (
    bucket_id = 'messages' and auth.uid() is not null
  );

create policy "Users can manage own product images"
  on storage.objects for delete using (
    bucket_id = 'products' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "ID docs accessible by owner only"
  on storage.objects for select using (
    bucket_id = 'id-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Shoppers can upload ID documents"
  on storage.objects for insert with check (
    bucket_id = 'id-documents'
    and auth.uid() is not null
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- SEED DATA
-- ============================================================

insert into categories (name, slug, icon) values
  ('Electronics', 'electronics', '💻'),
  ('Clothing & Fashion', 'clothing', '👗'),
  ('Beauty & Health', 'beauty', '💄'),
  ('Home & Kitchen', 'home', '🏠'),
  ('Sports & Outdoors', 'sports', '⚽'),
  ('Books & Education', 'books', '📚'),
  ('Toys & Games', 'toys', '🎮'),
  ('Food & Grocery', 'food', '🛒'),
  ('Automotive', 'automotive', '🚗'),
  ('Other', 'other', '📦')
on conflict (slug) do nothing;

insert into import_sources (name, slug) values
  ('AliExpress', 'aliexpress'),
  ('Shein', 'shein'),
  ('Amazon', 'amazon'),
  ('Temu', 'temu'),
  ('Local Market', 'local'),
  ('Other', 'other')
on conflict (slug) do nothing;

-- ============================================================
-- MIGRATIONS (run these against an EXISTING database)
-- Safe to run multiple times due to IF NOT EXISTS
-- ============================================================

alter table shopper_profiles
  drop column if exists wallet_balance,
  drop column if exists commission_rate,
  add column if not exists agreed_to_terms boolean not null default false,
  add column if not exists subscription_plan text default 'free',
  add column if not exists subscription_expires_at timestamptz,
  add column if not exists is_top_shopper boolean default false;

alter table orders
  drop column if exists commission_rate,
  drop column if exists payout_released;

alter table products
  add column if not exists is_featured boolean default false,
  add column if not exists boosted_until timestamptz;

alter table messages
  add column if not exists image_url text;

-- Dropped credit_shopper_wallet as Escrow is removed.
drop function if exists credit_shopper_wallet(uuid, numeric);

-- ============================================================
-- SUPPORT CHAT (AI & ADMIN)
-- ============================================================

create type support_session_status as enum ('bot', 'human', 'closed');
create type support_sender_type as enum ('user', 'bot', 'admin');

create table if not exists support_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  guest_id text, -- for anonymous users
  status support_session_status default 'bot',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists support_messages (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references support_sessions(id) on delete cascade not null,
  sender_type support_sender_type not null default 'user',
  content text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table support_sessions enable row level security;
alter table support_messages enable row level security;

-- Policies for sessions
create policy "Users can view own sessions"
  on support_sessions for select using (
    auth.uid() = user_id or guest_id = current_setting('request.jwt.claims', true)::json->>'guest_id'
  );

create policy "Admins can view all sessions"
  on support_sessions for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- We'll allow public inserts for sessions but restrict access based on guest_id or user_id
create policy "Public can create sessions"
  on support_sessions for insert with check (true);

-- Policies for messages
create policy "Users can view messages in their sessions"
  on support_messages for select using (
    exists (
      select 1 from support_sessions
      where id = support_messages.session_id
      and (user_id = auth.uid() or guest_id = current_setting('request.jwt.claims', true)::json->>'guest_id')
    )
  );

create policy "Admins can view all messages"
  on support_messages for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can insert messages to their sessions"
  on support_messages for insert with check (
    exists (
      select 1 from support_sessions
      where id = support_messages.session_id
      and (user_id = auth.uid() or guest_id = current_setting('request.jwt.claims', true)::json->>'guest_id')
    )
    or
    (auth.uid() is null) -- For pure guests making unauthenticated API calls
  );

-- Because the API route uses the service_role key to insert bot messages and create sessions,
-- it will bypass these RLS policies. The client will only use RLS for reading.

-- Note: In a real app, you might want to secure guest insertions further, but since we are using a 
-- server-side API route for the AI, we can handle message insertion there securely.

-- ============================================================
-- PROMOTIONS & CAMPAIGNS
-- ============================================================

create type promotion_status as enum ('upcoming', 'active', 'ended');
create type promotion_type as enum ('banner', 'flash_sale_campaign', 'shipping');
create type promotion_product_status as enum ('pending', 'approved', 'rejected');

create table if not exists promotions (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  type promotion_type not null default 'flash_sale_campaign',
  target_country text,
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

create trigger promotions_updated_at
  before update on promotions
  for each row execute function handle_updated_at();

create trigger promotion_products_updated_at
  before update on promotion_products
  for each row execute function handle_updated_at();

alter table promotions enable row level security;
alter table promotion_products enable row level security;

create policy "Promotions viewable by everyone"
  on promotions for select using (is_active = true);

create policy "Admins manage promotions"
  on promotions for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Approved promotion products viewable by everyone"
  on promotion_products for select using (status = 'approved');

create policy "Shoppers can view their own promotion products"
  on promotion_products for select using (shopper_id = auth.uid());

create policy "Shoppers can opt-in own products"
  on promotion_products for insert with check (
    shopper_id = auth.uid()
    and auth.uid() = (select shopper_id from products where id = product_id)
  );

create policy "Shoppers can update own pending opt-ins"
  on promotion_products for update using (
    shopper_id = auth.uid() and status = 'pending'
  );

create policy "Shoppers can delete own opt-ins"
  on promotion_products for delete using (
    shopper_id = auth.uid()
  );

create policy "Admins manage promotion products"
  on promotion_products for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create or replace function get_active_campaign_price(p_product_id uuid)
returns numeric language sql stable as $$
  select pp.special_price
  from promotion_products pp
  join promotions p on p.id = pp.promotion_id
  where pp.product_id = p_product_id
    and pp.status = 'approved'
    and p.is_active = true
    and p.status = 'active'
    and p.type = 'flash_sale_campaign'
    and now() between p.start_date and p.end_date
  order by pp.special_price asc
  limit 1;
$$;

create or replace function create_order(p_product_id uuid, p_quantity int default 1)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product products%rowtype;
  v_unit_price numeric;
  v_order_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  select * into v_product from products where id = p_product_id;
  if not found then raise exception 'Product not found'; end if;
  if not v_product.is_available then raise exception 'Product is not available'; end if;

  v_unit_price := coalesce(get_active_campaign_price(p_product_id), v_product.price);

  insert into orders (product_id, buyer_id, shopper_id, amount, status)
  values (p_product_id, auth.uid(), v_product.shopper_id, v_unit_price * p_quantity, 'pending')
  returning id into v_order_id;

  return v_order_id;
end;
$$;

-- ============================================================
-- MIGRATIONS (run these against an EXISTING database)
-- Safe to run multiple times due to IF NOT EXISTS
-- ============================================================

-- Migration for Admin Features (Platform Settings & User Suspend)

create table if not exists public.platform_settings (
  id uuid default uuid_generate_v4() primary key,
  maintenance_mode boolean default false,
  updated_at timestamptz default now()
);

insert into public.platform_settings (id, maintenance_mode)
select uuid_generate_v4(), false
where not exists (select 1 from public.platform_settings);

alter table public.platform_settings enable row level security;

drop policy if exists "Platform settings are viewable by everyone" on public.platform_settings;
create policy "Platform settings are viewable by everyone"
  on public.platform_settings for select using (true);

drop policy if exists "Admins can update platform settings" on public.platform_settings;
create policy "Admins can update platform settings"
  on public.platform_settings for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

drop trigger if exists platform_settings_updated_at on public.platform_settings;
create trigger platform_settings_updated_at
  before update on public.platform_settings
  for each row execute function handle_updated_at();

alter table profiles
  add column if not exists is_suspended boolean default false;


