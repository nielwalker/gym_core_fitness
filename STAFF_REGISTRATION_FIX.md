# Staff Registration Fix

## Issues Fixed

1. **Name and username not being saved** - The database trigger wasn't extracting name and username from user metadata
2. **Staff accounts not showing in users table** - The trigger was creating records but without name/username
3. **Staff accounts cannot login** - Login wasn't handling the `username@gymcore.com` email format correctly

## Changes Made

### 1. Database Trigger Update
- Updated `handle_new_user()` function to extract `name` and `username` from user metadata
- The trigger now automatically saves name and username when a user is created

### 2. Login Fix
- Updated login to automatically append `@gymcore.com` to usernames that don't contain `@`
- Staff can now login with just their username (e.g., `john_doe`) instead of the full email

### 3. Registration Improvement
- Added retry logic to ensure name and username are saved
- Improved error handling for edge cases

### 4. Backend API Enhancement
- Updated `/api/users/update` endpoint to handle cases where user record doesn't exist yet
- Added better error messages and logging

## What You Need to Do

### Step 1: Run the Database Migration

**IMPORTANT:** You must run this SQL migration in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open and run the file: `backend/database/migration_fix_staff_registration.sql`

This will:
- Ensure `name` and `username` columns exist in the `users` table
- Update the trigger function to extract name and username from metadata
- Recreate the trigger to ensure it's active

### Step 2: Test Staff Registration

1. Register a new staff member with:
   - Name: e.g., "John Doe"
   - Username: e.g., "john_doe"
   - Password: (any password)

2. Verify the staff member appears in the users table with:
   - Name saved correctly
   - Username saved correctly
   - Email as `username@gymcore.com`

### Step 3: Test Staff Login

1. Logout (if logged in)
2. Login with:
   - Username: `john_doe` (just the username, not the full email)
   - Password: (the password you set)

The login should work automatically by appending `@gymcore.com` to the username.

## For Existing Staff Accounts

If you have existing staff accounts that were created before this fix:

1. They should still be able to login (the login fix handles both formats)
2. However, their name and username might be missing in the users table
3. You can manually update them via the backend API or directly in Supabase

To update existing users, you can run this SQL in Supabase:

```sql
-- Update existing users with missing name/username
-- Replace 'user_id_here' with the actual user ID
UPDATE public.users 
SET 
  name = 'Staff Name',
  username = 'staff_username'
WHERE id = 'user_id_here';
```

Or use the User Management page in the admin dashboard if available.

## Verification

After running the migration, verify:

1. ✅ New staff registrations save name and username correctly
2. ✅ Staff accounts appear in the users table
3. ✅ Staff can login with just their username
4. ✅ Staff can access the dashboard after login

## Files Changed

- `backend/database/migration_fix_staff_registration.sql` - New migration file
- `backend/database/QUICK_SETUP.sql` - Updated trigger function
- `frontend/src/pages/Login.jsx` - Fixed login to handle username format
- `frontend/src/pages/admin/Register.jsx` - Improved registration with retry logic
- `backend/index.js` - Enhanced user update endpoint

## Troubleshooting

### If staff still can't login:
- Check that the migration was run successfully
- Verify the user exists in `auth.users` table in Supabase
- Check browser console for any error messages
- Try logging in with the full email format: `username@gymcore.com`

### If name/username still not saving:
- Verify the migration was run
- Check Supabase logs for trigger errors
- Check backend logs for API errors
- Try registering a new staff member to test

### If you get "User not found" errors:
- The trigger might not have fired
- Check if the user exists in `auth.users`
- Manually create the user record in the `users` table if needed

