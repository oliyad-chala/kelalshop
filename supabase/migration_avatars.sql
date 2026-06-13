-- ============================================================
-- Avatar Storage Bucket Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Create the avatars bucket (public so profile pictures are viewable)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB in bytes
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================================
-- RLS Policies for avatars bucket
-- ============================================================

-- Allow anyone to VIEW avatar images (they're public)
drop policy if exists "Public avatars are viewable by everyone" on storage.objects;
create policy "Public avatars are viewable by everyone"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Allow authenticated users to UPLOAD their own avatar
drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and name like 'avatars/' || auth.uid()::text || '.%'
  );

-- Allow authenticated users to UPDATE their own avatar
drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and name like 'avatars/' || auth.uid()::text || '.%'
  );

-- Allow authenticated users to DELETE their own avatar
drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and name like 'avatars/' || auth.uid()::text || '.%'
  );
