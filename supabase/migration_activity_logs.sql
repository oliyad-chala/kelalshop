-- ============================================================
-- Activity Logs Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

create table if not exists public.activity_logs (
  id           uuid default uuid_generate_v4() primary key,
  admin_id     uuid references public.profiles(id) on delete set null,
  admin_name   text not null,
  action_type  text not null,
  entity_type  text,
  entity_id    text,
  description  text not null,
  old_data     jsonb,
  new_data     jsonb,
  ip_address   text,
  created_at   timestamptz default now() not null
);

-- Index for fast filtering
create index if not exists activity_logs_admin_id_idx    on public.activity_logs (admin_id);
create index if not exists activity_logs_action_type_idx on public.activity_logs (action_type);
create index if not exists activity_logs_entity_type_idx on public.activity_logs (entity_type);
create index if not exists activity_logs_created_at_idx  on public.activity_logs (created_at desc);

-- Enable RLS
alter table public.activity_logs enable row level security;

-- Only admins can SELECT
drop policy if exists "Admins can view activity logs" on public.activity_logs;
create policy "Admins can view activity logs"
  on public.activity_logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- INSERT is done only via service role (bypasses RLS) — no anon/user insert policy
-- UPDATE and DELETE: no policies = blocked for everyone
