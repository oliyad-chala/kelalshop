-- ============================================================
-- KelalShop — Save Phone Number in Profiles & Sync Existing
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Update handle_new_user to persist phone from user_metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _role text;
  _phone text;
begin
  _role := coalesce(new.raw_user_meta_data->>'role', 'buyer');
  if _role not in ('buyer', 'shopper') then
    _role := 'buyer';
  end if;

  _phone := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '');

  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    _phone,
    _role::public.user_role
  )
  on conflict (id) do update
  set 
    phone = coalesce(public.profiles.phone, excluded.phone),
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name);

  if _role = 'shopper' then
    insert into public.shopper_profiles (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

-- 2. Backfill existing profiles that have phone in auth.users metadata but null in profiles
update public.profiles p
set phone = nullif(trim(u.raw_user_meta_data->>'phone'), '')
from auth.users u
where p.id = u.id
  and p.phone is null
  and nullif(trim(u.raw_user_meta_data->>'phone'), '') is not null;
