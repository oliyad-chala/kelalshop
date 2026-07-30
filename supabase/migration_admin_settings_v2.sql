-- Migration to add admin/platform settings columns
-- Safe to run multiple times

-- 1. Add settings columns to platform_settings
alter table public.platform_settings
  add column if not exists platform_name text default 'KelalShop',
  add column if not exists support_email text default 'support@kelalshop.com',
  add column if not exists auto_verify_sellers boolean default false;

-- 2. Add settings columns to profiles (for admin preferences)
alter table public.profiles
  add column if not exists notif_verifications boolean default true,
  add column if not exists notif_payments boolean default true,
  add column if not exists notif_disputes boolean default true,
  add column if not exists notif_new_sellers boolean default false,
  add column if not exists email_digest boolean default true,
  add column if not exists digest_email_address text,
  add column if not exists session_timeout integer default 30,
  add column if not exists two_factor boolean default false;
