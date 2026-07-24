-- Create newsletter subscribers table
create table if not exists public.newsletter_subscribers (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.newsletter_subscribers enable row level security;

-- Policy to allow inserts from anyone (public submission)
create policy "Allow public inserts" on public.newsletter_subscribers
  for insert with check (true);

-- Policy to allow select only by admins (authenticated service_role)
create policy "Allow select by admin" on public.newsletter_subscribers
  for select using (auth.role() = 'service_role');
