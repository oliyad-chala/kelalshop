-- Add OTP fields to user_devices for verification
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS otp_code text;
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS otp_expires_at timestamptz;
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS otp_attempts int DEFAULT 0;
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS otp_sent_at timestamptz;
