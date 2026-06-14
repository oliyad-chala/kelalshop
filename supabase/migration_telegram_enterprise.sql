-- KelalShop Telegram Enterprise Migration
-- Run after migration_telegram_bot.sql and migration_customer_bot.sql

-- Audit logs for bot commands
CREATE TABLE IF NOT EXISTS public.telegram_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bot TEXT NOT NULL CHECK (bot IN ('admin', 'customer')),
    chat_id BIGINT NOT NULL,
    command TEXT,
    role TEXT,
    result TEXT NOT NULL CHECK (result IN ('success', 'denied', 'error')),
    duration_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telegram_audit_logs_chat ON public.telegram_audit_logs(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telegram_audit_logs_created ON public.telegram_audit_logs(created_at DESC);

-- Notification queue
CREATE TABLE IF NOT EXISTS public.telegram_notification_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel TEXT NOT NULL CHECK (channel IN ('admin', 'customer')),
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    scheduled_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    last_error TEXT,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON public.telegram_notification_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_channel ON public.telegram_notification_queue(channel, status);

-- Dead letter queue
CREATE TABLE IF NOT EXISTS public.telegram_notification_dlq (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_id UUID,
    channel TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    attempts INTEGER NOT NULL,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Broadcast state (persistent across serverless)
CREATE TABLE IF NOT EXISTS public.telegram_broadcast_state (
    chat_id BIGINT PRIMARY KEY,
    admin_role TEXT,
    step TEXT NOT NULL DEFAULT 'awaiting_message',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_telegram_admins_chat_approved ON public.telegram_admins(telegram_chat_id) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_telegram_users_chat ON public.telegram_users(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_profile ON public.telegram_users(profile_id) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_created ON public.orders(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_approval_pending ON public.products(approval_status) WHERE approval_status = 'pending';

-- Circuit breaker state
CREATE TABLE IF NOT EXISTS public.telegram_circuit_breaker (
    id TEXT PRIMARY KEY DEFAULT 'telegram_api',
    failure_count INTEGER NOT NULL DEFAULT 0,
    opened_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

INSERT INTO public.telegram_circuit_breaker (id, failure_count) VALUES ('telegram_api', 0)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.telegram_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_notification_dlq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_broadcast_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_circuit_breaker ENABLE ROW LEVEL SECURITY;
