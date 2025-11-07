# Supabase Setup Guide

## Database Schema Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `QUICK_SETUP.sql`
4. Run the SQL script

This will create:
- `users` table (extends auth.users)
- `customers` table
- `products` table
- `sales` table
- Row Level Security policies
- Indexes for performance

## Creating Your First Admin User

After setting up the database:

1. Go to Authentication > Users in Supabase dashboard
2. Create a new user or use email signup
3. Go to SQL Editor and run:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

Replace `your-admin-email@example.com` with your actual admin email.

## Getting API Keys

1. Go to Settings > API in Supabase dashboard
2. Copy:
   - **Project URL** → Use for `SUPABASE_URL` and `VITE_SUPABASE_URL`
   - **anon/public key** → Use for `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → Use for `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Security Notes

- Never expose the `service_role` key in client-side code
- The `anon` key is safe to use in the frontend
- Row Level Security (RLS) is enabled on all tables

