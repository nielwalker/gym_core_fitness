-- Create logbook table for walk-in customers
CREATE TABLE IF NOT EXISTS public.logbook (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('student', 'regular', 'walk-in')),
  amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_logbook_created_at ON public.logbook(created_at);

-- Enable Row Level Security
ALTER TABLE public.logbook ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role can access logbook" ON public.logbook;

-- Policy for logbook table - allow service role to access
CREATE POLICY "Service role can access logbook"
  ON public.logbook FOR ALL
  USING (true)
  WITH CHECK (true);

