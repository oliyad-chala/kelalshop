-- Email Log Table for Tracking, Deduplication, and Auditing
CREATE TABLE IF NOT EXISTS email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text UNIQUE NOT NULL,       -- prevents duplicates
  type text NOT NULL,                         -- 'otp', 'welcome', 'order-confirmation', etc.
  recipient text NOT NULL,
  subject text,
  resend_id text,                             -- Resend's returned email ID
  status text DEFAULT 'pending',              -- 'pending' | 'sent' | 'failed'
  attempt_count int DEFAULT 0,
  error text,
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);

-- Enable RLS
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- Create policy for service role/admins only (users should not read raw email logs)
CREATE POLICY "Admins can do everything on email_log"
  ON email_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
