-- ============================================================
-- KelalShop — Messages Realtime & Read-Status Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Enable REPLICA IDENTITY FULL on messages so Realtime can
--    broadcast the full row payload (needed for postgres_changes).
alter table messages replica identity full;

-- 2. Add the messages table to the Supabase Realtime publication
--    (safe to run multiple times — will error silently if already added).
do $$
begin
  perform pg_publication_tables.tablename
  from pg_publication_tables
  where pubname = 'supabase_realtime'
    and schemaname = 'public'
    and tablename = 'messages';

  if not found then
    alter publication supabase_realtime add table messages;
  end if;
end;
$$;

-- 3. Allow order participants to update is_read on messages they received.
--    The original policy only allows recipient_id, which is correct.
--    Re-create it cleanly in case it was missing.
drop policy if exists "Recipients can mark messages as read" on messages;

create policy "Recipients can mark messages as read"
  on messages for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- 4. Ensure order participants can SELECT messages on their orders
--    (the old policy used sender/recipient — keep it, just make sure it exists).
-- (No change needed — existing policy covers this)
