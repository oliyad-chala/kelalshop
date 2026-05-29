-- Add approval_status and approval_notes to products table
ALTER TABLE public.products 
ADD COLUMN approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN approval_notes text;

-- Set existing products to approved so they don't disappear from the site
UPDATE public.products SET approval_status = 'approved';
