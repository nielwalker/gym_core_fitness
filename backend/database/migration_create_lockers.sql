-- Create lockers table for locker registrations
CREATE TABLE IF NOT EXISTS public.lockers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  locker_number TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'Gcash')),
  amount DECIMAL(10, 2) NOT NULL,
  registered_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  staff_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lockers_created_at ON public.lockers(created_at);
CREATE INDEX IF NOT EXISTS idx_lockers_registered_date ON public.lockers(registered_date);
CREATE INDEX IF NOT EXISTS idx_lockers_expiration_date ON public.lockers(expiration_date);
CREATE INDEX IF NOT EXISTS idx_lockers_locker_number ON public.lockers(locker_number);
CREATE INDEX IF NOT EXISTS idx_lockers_staff_id ON public.lockers(staff_id);

-- Enable Row Level Security
ALTER TABLE public.lockers ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role can access lockers" ON public.lockers;

-- Policy for lockers table - allow service role to access
CREATE POLICY "Service role can access lockers"
  ON public.lockers FOR ALL
  USING (true)
  WITH CHECK (true);

