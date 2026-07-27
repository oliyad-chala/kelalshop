-- Alter support_sessions to support human takeover routing
ALTER TABLE public.support_sessions ADD COLUMN IF NOT EXISTS assigned_staff_tg_chat_id BIGINT;

-- Create search_logs table to track user queries (and lost demand)
CREATE TABLE IF NOT EXISTS public.search_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query TEXT NOT NULL,
    results_count INTEGER NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create telegram_reminder_logs to avoid duplicate cart abandonment spam
CREATE TABLE IF NOT EXISTS public.telegram_reminder_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    reminder_type TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_reminder_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role full access on search_logs" 
    ON public.search_logs FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on telegram_reminder_logs" 
    ON public.telegram_reminder_logs FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view search logs" 
    ON public.search_logs FOR SELECT USING (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );
