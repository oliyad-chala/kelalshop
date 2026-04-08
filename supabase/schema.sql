-- ============================================================
-- KelalShop — Full Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================
create type user_role as enum ('buyer', 'shopper', 'admin');
create type verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type order_status as enum ('pending', 'accepted', 'shipped', 'delivered', 'cancelled', 'disputed');
create type request_status as enum ('open', 'assigned', 'completed', 'cancelled');

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
  is_read boolean default false,
  created_at timestamptz default now()
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

create or replace function public.handle_new_user()
returns trigger
set search_path = ''
as $$
declare
  _role text;
begin
  _role := coalesce(new.raw_user_meta_data->>'role', 'buyer');

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
    select coalesce(round(avg(rating)::numeric, 0)::integer, 0)
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
  on reviews for insert with check (auth.uid() = reviewer_id);

-- Messages
create policy "Messages visible to sender and recipient"
  on messages for select using (
    auth.uid() = sender_id or auth.uid() = recipient_id
  );

create policy "Authenticated users can send messages"
  on messages for insert with check (auth.uid() = sender_id);

create policy "Recipients can mark messages as read"
  on messages for update using (auth.uid() = recipient_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('products', 'products', true),
  ('id-documents', 'id-documents', false)
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
