-- Add note column to logbook table
ALTER TABLE public.logbook 
ADD COLUMN IF NOT EXISTS note TEXT;

