-- Revoke execution rights on admin audit/lockout RPCs from client roles
REVOKE EXECUTE ON FUNCTION public.log_admin_audit(text, text, text) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.count_admin_login_failures(text, integer) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.count_admin_login_failures_by_email(text, integer) FROM public, anon, authenticated;

-- Grant execution rights solely to service_role (system/server admin)
GRANT EXECUTE ON FUNCTION public.log_admin_audit(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.count_admin_login_failures(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.count_admin_login_failures_by_email(text, integer) TO service_role;
