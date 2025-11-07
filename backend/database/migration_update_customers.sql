-- Migration to update customers table with new fields
-- Run this in your Supabase SQL Editor

-- Add new columns to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS contact_no TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('Cash', 'Gcash', 'Partial')),
ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS partial_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS registration_type TEXT CHECK (registration_type IN ('Monthly', 'Membership')),
ADD COLUMN IF NOT EXISTS expiration_date DATE;

-- Update existing records to have default values
UPDATE customers 
SET 
  contact_no = COALESCE(contact_no, phone),
  payment_method = COALESCE(payment_method, 'Cash'),
  registration_type = COALESCE(registration_type, 
    CASE 
      WHEN membership_type = 'monthly' THEN 'Monthly'
      WHEN membership_type = 'quarterly' THEN 'Monthly'
      WHEN membership_type = 'yearly' THEN 'Membership'
      ELSE 'Monthly'
    END
  ),
  expiration_date = COALESCE(expiration_date, end_date)
WHERE contact_no IS NULL OR payment_method IS NULL OR registration_type IS NULL OR expiration_date IS NULL;

-- Make contact_no required (if you want to enforce it)
-- ALTER TABLE customers ALTER COLUMN contact_no SET NOT NULL;

