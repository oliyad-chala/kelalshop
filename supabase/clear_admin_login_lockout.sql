-- Clear admin login lockout (run in Supabase SQL Editor)
-- Replace the email below with yours if needed.

delete from public.admin_audit_log
where action in ('login_failed', 'login_denied_not_admin')
  and (
    lower(admin_email) = lower('oliyadchala24@gmail.com')
    or ip_address in ('127.0.0.1', '::1', 'unknown')
  );

-- Optional: clear generic rate-limit keys used elsewhere
delete from public.rate_limits
where identifier like 'admin_login_%';
