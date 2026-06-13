CREATE TABLE IF NOT EXISTS public.telegram_users (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id     BIGINT UNIQUE NOT NULL,
    profile_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    username    TEXT,
    first_name  TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    otp_code    TEXT,
    otp_expires_at TIMESTAMPTZ,
    otp_attempts   INTEGER DEFAULT 0,
    linked_at   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.telegram_users
    USING (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS public.telegram_broadcast_logs (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id    BIGINT NOT NULL,
    target      TEXT NOT NULL, -- 'all_users', 'all_sellers', 'custom'
    message     TEXT NOT NULL,
    sent_count  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS total_amount numeric(10,2) GENERATED ALWAYS AS (amount) STORED;
