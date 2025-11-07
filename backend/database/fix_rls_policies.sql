-- Fix RLS policies to allow service role access
-- Run this in your Supabase SQL Editor

-- Drop existing policies for sales table
DROP POLICY IF EXISTS "Authenticated users can view sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON sales;

-- Create new policies that allow service role and authenticated users
CREATE POLICY "Service role and authenticated users can view sales"
  ON sales FOR SELECT
  USING (
    auth.role() = 'authenticated' OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Service role and authenticated users can insert sales"
  ON sales FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Drop existing policies for products table
DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;

-- Create new policies for products
CREATE POLICY "Service role and authenticated users can view products"
  ON products FOR SELECT
  USING (
    auth.role() = 'authenticated' OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Service role and authenticated users can manage products"
  ON products FOR ALL
  USING (
    auth.role() = 'authenticated' OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Drop existing policies for customers table
DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;

-- Create new policies for customers
CREATE POLICY "Service role and authenticated users can view customers"
  ON customers FOR SELECT
  USING (
    auth.role() = 'authenticated' OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Service role and authenticated users can insert customers"
  ON customers FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

