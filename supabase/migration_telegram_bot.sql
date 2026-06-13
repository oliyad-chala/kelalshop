-- Migration for Telegram Bot Integration

CREATE TABLE IF NOT EXISTS public.telegram_admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_chat_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.telegram_admins ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view telegram_admins" ON public.telegram_admins
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert telegram_admins" ON public.telegram_admins
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update telegram_admins" ON public.telegram_admins
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete telegram_admins" ON public.telegram_admins
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Insert the user's provided admin chat ID automatically for convenience
INSERT INTO public.telegram_admins (telegram_chat_id, username, role, is_approved)
VALUES (8983715450, 'Initial Admin', 'admin', TRUE)
ON CONFLICT (telegram_chat_id) DO NOTHING;
