-- ============================================================
-- KelalShop — Security & Fraud Prevention
-- ============================================================

-- 1. Rate Limits Table
create table if not exists rate_limits (
  identifier text primary key,
  requests integer not null default 1,
  expires_at timestamptz not null
);

-- Note: We rely on standard Supabase Postgres; in production with high scale,
-- consider an UNLOGGED table or Upstash Redis.

-- 2. Login Attempts Tracking
create table if not exists login_attempts (
  id uuid default uuid_generate_v4() primary key,
  email text not null,
  ip_address text,
  device_fingerprint text,
  is_success boolean not null default false,
  created_at timestamptz default now()
);
create index idx_login_attempts_email on login_attempts(email);
create index idx_login_attempts_ip on login_attempts(ip_address);

-- 3. User Devices (Trusted Fingerprints)
create table if not exists user_devices (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  device_fingerprint text not null,
  ip_address text,
  user_agent text,
  last_login_at timestamptz default now(),
  is_verified boolean default false,
  created_at timestamptz default now(),
  unique(user_id, device_fingerprint)
);

-- 4. Profile Additions for Lock/Verification
alter table profiles 
add column if not exists requires_verification boolean default false;

-- RLS
alter table rate_limits enable row level security;
alter table login_attempts enable row level security;
alter table user_devices enable row level security;

-- Admin access
create policy "Admins can view rate limits" on rate_limits for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can view login attempts" on login_attempts for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can view user devices" on user_devices for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Users can view their own devices
create policy "Users view own devices" on user_devices for select using (auth.uid() = user_id);

-- Rate limits, login attempts, and admin audit logging use SECURITY DEFINER RPCs.
-- Run supabase/migration_security_hardening.sql after this file.
