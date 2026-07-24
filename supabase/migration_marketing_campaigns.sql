-- Create marketing campaigns table
create table if not exists public.marketing_campaigns (
  id uuid default gen_random_uuid() primary key,
  subject text not null,
  content text not null,
  target_audience text not null, -- 'newsletter_subscribers' or 'registered_users'
  status text not null default 'draft', -- 'draft', 'sending', 'sent', 'failed'
  sent_count integer default 0,
  failed_count integer default 0,
  image_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  sent_at timestamptz
);

-- Enable RLS
alter table public.marketing_campaigns enable row level security;

-- Admin policies
create policy "Allow all actions for service_role" on public.marketing_campaigns
  using (true) with check (true);

-- Authenticated admins can see and manage campaigns
create policy "Allow select for admin users" on public.marketing_campaigns
  for select using (auth.role() = 'authenticated');

create policy "Allow insert/update/delete for admin users" on public.marketing_campaigns
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Create marketing storage bucket
insert into storage.buckets (id, name, public)
values ('marketing', 'marketing', true)
on conflict (id) do nothing;

-- Allow public access to view marketing campaign images
create policy "Marketing campaign images are publicly accessible"
  on storage.objects for select using (bucket_id = 'marketing');

-- Allow authenticated users to upload campaign images
create policy "Authenticated users can upload marketing images"
  on storage.objects for insert with check (
    bucket_id = 'marketing' and auth.uid() is not null
  );

-- Allow authenticated users to delete marketing images
create policy "Authenticated users can delete marketing images"
  on storage.objects for delete using (
    bucket_id = 'marketing' and auth.uid() is not null
  );
