-- Create wishlists table
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, product_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own wishlists"
ON public.wishlists
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own wishlists"
ON public.wishlists
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own wishlists"
ON public.wishlists
FOR DELETE
USING (auth.uid() = user_id);
