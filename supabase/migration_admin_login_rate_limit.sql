-- Admin login brute-force protection (run if you already applied migration_security_hardening.sql)

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
