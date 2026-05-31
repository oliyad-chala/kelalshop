-- Add staff role to user_role enum (run once in Supabase SQL Editor)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'staff';
