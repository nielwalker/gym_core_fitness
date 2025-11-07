# Disable Email Confirmation in Supabase

## Option 1: Disable in Supabase Dashboard (Recommended)

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Providers**
3. Click on **Email** provider
4. Find the **"Confirm email"** toggle
5. **Turn OFF** the "Confirm email" option
6. Click **Save**

This will disable email confirmation for all new users going forward.

## Option 2: Auto-Confirm via Backend (Already Implemented)

The application now uses a backend endpoint (`/api/users/create`) that automatically confirms staff emails when they're created. This means:

- ✅ New staff members can login immediately after registration
- ✅ No email confirmation required
- ✅ Works even if email confirmation is enabled in Supabase

## For Existing Users

If you have existing staff users who haven't confirmed their email:

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Find the user
3. Click on the user
4. Click **"Confirm email"** button
5. Or run this SQL in the SQL Editor:

```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'username@gymcore.com';
```

Replace `username@gymcore.com` with the actual email.

## Verify It's Working

1. Register a new staff member
2. Try to login immediately with that staff account
3. It should work without any email confirmation

## Notes

- The backend endpoint uses the `service_role` key to bypass email confirmation
- This only affects staff accounts created through the admin registration form
- Regular email signups (if enabled) will still require confirmation unless disabled in dashboard

