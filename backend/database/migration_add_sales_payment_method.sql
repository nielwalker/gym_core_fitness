-- Add payment_method column to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('Cash', 'Gcash'));

