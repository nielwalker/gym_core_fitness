-- Migration to add password-based authentication (no email required)
-- Run this in your Supabase SQL Editor

-- Step 1: Remove foreign key constraint to auth.users (if exists)
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Step 2: Make email nullable (no longer required)
ALTER TABLE public.users 
ALTER COLUMN email DROP NOT NULL;

-- Step 3: Remove unique constraint on email (since it can be null)
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_email_key;

-- Step 4: Add password_hash column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Step 5: Create index on username for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Step 6: Update the table to allow id to be generated without auth.users reference
-- Note: The id column will now be a regular UUID, not referencing auth.users

-- Note: This migration allows username/password authentication without email
-- Passwords will be hashed using bcrypt in the backend
-- Users are no longer tied to Supabase Auth

