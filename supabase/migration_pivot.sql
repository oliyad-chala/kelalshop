-- Migration: Pivot to Ads & Subscription Model
-- Run this in your Supabase SQL Editor

-- 1. Add new columns
alter table shopper_profiles
  add column if not exists subscription_plan text default 'free',
  add column if not exists subscription_expires_at timestamptz;

alter table products
  add column if not exists is_featured boolean default false,
  add column if not exists boosted_until timestamptz;

-- 2. Drop Escrow/Financial Columns
alter table shopper_profiles
  drop column if exists wallet_balance,
  drop column if exists commission_rate;

alter table orders
  drop column if exists commission_rate,
  drop column if exists payout_released;

-- 3. Drop Escrow RPC Functions
drop function if exists credit_shopper_wallet(uuid, numeric);

-- ADDED FOR PAYMENT VERIFICATION SYSTEM
DO $$ BEGIN
  create type payment_request_status as enum ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

create table if not exists payment_requests (
  id uuid default uuid_generate_v4() primary key,
  shopper_id uuid references profiles(id) on delete cascade not null,
  payment_type text not null,
  target_id uuid,
  amount numeric(10,2) not null check (amount >= 0),
  reference_number text not null,
  status payment_request_status default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table payment_requests enable row level security;

-- Drop policies if they exist so we can recreate them
drop policy if exists "Shoppers can view own payment requests" on payment_requests;
drop policy if exists "Shoppers can insert own payment requests" on payment_requests;
drop policy if exists "Admins view all payment requests" on payment_requests;
drop policy if exists "Admins update all payment requests" on payment_requests;

create policy "Shoppers can view own payment requests"
  on payment_requests for select using (auth.uid() = shopper_id);

create policy "Shoppers can insert own payment requests"
  on payment_requests for insert with check (auth.uid() = shopper_id);

create policy "Admins view all payment requests"
  on payment_requests for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins update all payment requests"
  on payment_requests for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
