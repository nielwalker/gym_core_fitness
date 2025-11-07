-- Migration to add name and username fields to users table
-- Run this in your Supabase SQL Editor

-- Add name and username columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS username TEXT;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

