-- ============================================================
-- KelalShop — OTP Email Verification Schema & Logs
-- ============================================================

-- 1. Email Verifications table (stores pending OTPs)
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  otp_hash text NOT NULL,
  attempts integer DEFAULT 0 CHECK (attempts >= 0),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Email Verification Logs (logs attempts for auditing)
CREATE TABLE IF NOT EXISTS public.email_verification_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  ip_address text,
  user_agent text,
  is_success boolean NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_logs ENABLE ROW LEVEL SECURITY;

-- Revoke public access, allow service_role and admin
REVOKE ALL ON public.email_verifications FROM public;
REVOKE ALL ON public.email_verification_logs FROM public;

-- Admin read policy
CREATE POLICY "Admins can view email verifications" 
  ON public.email_verifications FOR SELECT 
  USING (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

CREATE POLICY "Admins can view verification logs" 
  ON public.email_verification_logs FOR SELECT 
  USING (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
