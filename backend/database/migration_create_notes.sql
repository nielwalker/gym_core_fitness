-- Create notes table for admin notes
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  note TEXT,
  amount DECIMAL(10, 2),
  date DATE NOT NULL,
  staff_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notes_date ON public.notes(date);
CREATE INDEX IF NOT EXISTS idx_notes_staff_id ON public.notes(staff_id);

-- Enable Row Level Security
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role can access notes" ON public.notes;

-- Policy for notes table - allow service role to access
CREATE POLICY "Service role can access notes"
  ON public.notes FOR ALL
  USING (true)
  WITH CHECK (true);

