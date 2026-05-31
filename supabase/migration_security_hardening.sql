-- ============================================================
-- KelalShop — Security hardening (run in Supabase SQL Editor)
-- ============================================================

-- ── 1. Safe signup roles ─────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _role text;
begin
  _role := coalesce(new.raw_user_meta_data->>'role', 'buyer');
  if _role not in ('buyer', 'shopper') then
    _role := 'buyer';
  end if;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    _role::public.user_role
  );

  if _role = 'shopper' then
    insert into public.shopper_profiles (id)
    values (new.id);
  end if;

  return new;
end;
$$;

-- ── 2. Block privilege escalation on profiles ────────────────────────────────
create or replace function public.protect_profile_sensitive_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
      new.role := old.role;
      new.trust_score := old.trust_score;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profiles_sensitive on public.profiles;
create trigger protect_profiles_sensitive
  before update on public.profiles
  for each row execute function public.protect_profile_sensitive_columns();

-- ── 3. Reviews: require delivered order participation ────────────────────────
drop policy if exists "Users can write reviews for completed orders" on public.reviews;
create policy "Users can write reviews for completed orders"
  on public.reviews for insert
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.buyer_id = auth.uid()
        and o.status = 'delivered'
        and o.shopper_id = reviewee_id
    )
  );

-- ── 4. Rate limiting (SECURITY DEFINER — bypasses RLS safely) ────────────────
create or replace function public.check_rate_limit(
  p_identifier text,
  p_max_requests integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record public.rate_limits%rowtype;
  v_expires timestamptz;
begin
  delete from public.rate_limits
  where identifier = p_identifier
    and expires_at < now();

  select * into v_record
  from public.rate_limits
  where identifier = p_identifier;

  if not found then
    v_expires := now() + make_interval(secs => p_window_seconds);
    insert into public.rate_limits (identifier, requests, expires_at)
    values (p_identifier, 1, v_expires);
    return true;
  end if;

  if v_record.requests >= p_max_requests then
    return false;
  end if;

  update public.rate_limits
  set requests = v_record.requests + 1
  where identifier = p_identifier;

  return true;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to anon, authenticated, service_role;

-- ── 5. Login attempts logging ────────────────────────────────────────────────
create or replace function public.log_login_attempt(
  p_email text,
  p_ip_address text,
  p_device_fingerprint text,
  p_is_success boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.login_attempts (email, ip_address, device_fingerprint, is_success)
  values (p_email, p_ip_address, p_device_fingerprint, p_is_success);
end;
$$;

revoke all on function public.log_login_attempt(text, text, text, boolean) from public;
grant execute on function public.log_login_attempt(text, text, text, boolean) to anon, authenticated, service_role;

-- ── 6. User devices RLS ──────────────────────────────────────────────────────
drop policy if exists "Users insert own devices" on public.user_devices;
create policy "Users insert own devices"
  on public.user_devices for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own devices" on public.user_devices;
create policy "Users update own devices"
  on public.user_devices for update
  using (auth.uid() = user_id);

-- ── 7. Admin audit log (used by admin portal rate limiting) ──────────────────
create table if not exists public.admin_audit_log (
  id uuid default uuid_generate_v4() primary key,
  admin_email text,
  action text not null,
  ip_address text,
  created_at timestamptz default now()
);

create index if not exists idx_admin_audit_log_ip_action
  on public.admin_audit_log (ip_address, action, created_at);

alter table public.admin_audit_log enable row level security;

drop policy if exists "Admins view audit log" on public.admin_audit_log;
create policy "Admins view audit log"
  on public.admin_audit_log for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create or replace function public.log_admin_audit(
  p_action text,
  p_email text,
  p_ip text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_action not in ('login_failed', 'login_denied_not_admin', 'login_success') then
    raise exception 'invalid audit action';
  end if;
  insert into public.admin_audit_log (action, admin_email, ip_address)
  values (p_action, p_email, p_ip);
end;
$$;

revoke all on function public.log_admin_audit(text, text, text) from public;
grant execute on function public.log_admin_audit(text, text, text) to anon, authenticated, service_role;

-- Count failed admin logins (works before user is authenticated — bypasses RLS)
create or replace function public.count_admin_login_failures(
  p_ip text,
  p_window_minutes integer default 15
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  select count(*)::integer into v_count
  from public.admin_audit_log
  where ip_address = p_ip
    and action in ('login_failed', 'login_denied_not_admin')
    and created_at >= now() - make_interval(mins => p_window_minutes);
  return coalesce(v_count, 0);
end;
$$;

create or replace function public.count_admin_login_failures_by_email(
  p_email text,
  p_window_minutes integer default 15
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  select count(*)::integer into v_count
  from public.admin_audit_log
  where lower(admin_email) = lower(p_email)
    and action in ('login_failed', 'login_denied_not_admin')
    and created_at >= now() - make_interval(mins => p_window_minutes);
  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.count_admin_login_failures(text, integer) from public;
grant execute on function public.count_admin_login_failures(text, integer) to anon, authenticated, service_role;

revoke all on function public.count_admin_login_failures_by_email(text, integer) from public;
grant execute on function public.count_admin_login_failures_by_email(text, integer) to anon, authenticated, service_role;

-- ── 8. Private receipts bucket ───────────────────────────────────────────────
update storage.buckets set public = false where id = 'receipts';

drop policy if exists "Public can view receipts" on storage.objects;
drop policy if exists "Shoppers can view own receipts" on storage.objects;
drop policy if exists "Receipts accessible by admin" on storage.objects;
drop policy if exists "Shoppers can upload receipts" on storage.objects;

create policy "Shoppers upload own receipts"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Shoppers view own receipts"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Admins view all receipts"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
