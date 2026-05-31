-- Migration: Update Payment Requests for Receipts
-- Run this in your Supabase SQL Editor → https://supabase.com/dashboard/project/_/sql

-- 1. Make reference_number nullable (don't drop it so we don't lose old data)
alter table payment_requests alter column reference_number drop not null;

-- 2. Add receipt_url column
alter table payment_requests add column if not exists receipt_url text;

-- 3. Create the 'receipts' storage bucket (PUBLIC so thumbnails load in admin)
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do update set public = true;

-- 4. Storage Policies for 'receipts' bucket

-- Drop existing policies if running multiple times
drop policy if exists "Receipts accessible by admin" on storage.objects;
drop policy if exists "Shoppers can view own receipts" on storage.objects;
drop policy if exists "Shoppers can upload receipts" on storage.objects;
drop policy if exists "Public can view receipts" on storage.objects;

-- Anyone can view receipts (needed for admin thumbnail preview)
create policy "Public can view receipts"
  on storage.objects for select using (
    bucket_id = 'receipts'
  );

-- Shopper can upload their own
create policy "Shoppers can upload receipts"
  on storage.objects for insert with check (
    bucket_id = 'receipts'
    and auth.uid() is not null
  );
