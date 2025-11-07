-- Add staff_id column to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.users(id);

-- Add staff_id and payment_method columns to logbook table
ALTER TABLE public.logbook 
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('Cash', 'Gcash'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_staff_id ON public.customers(staff_id);
CREATE INDEX IF NOT EXISTS idx_logbook_staff_id ON public.logbook(staff_id);

