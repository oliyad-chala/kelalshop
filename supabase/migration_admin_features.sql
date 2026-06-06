-- Migration for Admin Features (Platform Settings & User Suspend)

-- 1. Add platform_settings table
create table if not exists public.platform_settings (
  id uuid default uuid_generate_v4() primary key,
  maintenance_mode boolean default false,
  updated_at timestamptz default now()
);

-- Ensure there is a single row
insert into public.platform_settings (id, maintenance_mode)
select uuid_generate_v4(), false
where not exists (select 1 from public.platform_settings);

-- Enable RLS
alter table public.platform_settings enable row level security;

-- Policies
create policy "Platform settings are viewable by everyone"
  on public.platform_settings for select using (true);

create policy "Admins can update platform settings"
  on public.platform_settings for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Trigger for updated_at
create trigger platform_settings_updated_at
  before update on public.platform_settings
  for each row execute function handle_updated_at();

-- 2. Add is_suspended to profiles
alter table profiles
  add column if not exists is_suspended boolean default false;
