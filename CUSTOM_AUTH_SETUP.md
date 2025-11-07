# Custom Authentication Setup (No Email Required)

## Overview

The application now uses **custom username/password authentication** instead of Supabase Auth. This means:
- ✅ **No email required** - Users only need username and password
- ✅ **No email confirmation** - Users can login immediately after registration
- ✅ **JWT-based authentication** - Secure token-based auth
- ✅ **Password hashing** - Passwords are hashed with bcrypt

## Database Migration Required

**IMPORTANT:** You must run the migration SQL in Supabase:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run the file: `backend/database/migration_add_password_auth.sql`

This will:
- Remove foreign key to `auth.users`
- Make email nullable
- Add `password_hash` column
- Allow users to be created without email

## Environment Variables

Add to your backend `.env` file (or Vercel environment variables):

```
JWT_SECRET=your-secure-random-secret-key-here
```

**Important:** Use a strong, random secret key in production!

## How It Works

### Registration
1. Admin creates staff account with name, username, and password
2. Backend hashes password with bcrypt
3. User record created in database with `password_hash`
4. No email or Supabase Auth required

### Login
1. User enters username and password
2. Backend looks up user by username
3. Verifies password against `password_hash`
4. Returns JWT token if valid
5. Frontend stores token and user info

### Authentication
- JWT token is sent with each API request
- Token expires after 7 days
- Token stored in localStorage

## For Existing Users

If you have existing users created with Supabase Auth:

1. **Option A:** Re-register them using the new system
2. **Option B:** Migrate passwords (requires password reset)

## Security Notes

- Passwords are hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days
- Tokens are stored in localStorage (consider httpOnly cookies for production)
- Use a strong `JWT_SECRET` in production

## Testing

1. Register a new staff member
2. Login with username and password (no email needed)
3. Verify JWT token is stored
4. Verify API requests include the token

## Files Changed

- `backend/index.js` - Added custom auth endpoints
- `backend/package.json` - Added bcryptjs, jsonwebtoken, uuid
- `frontend/src/pages/Login.jsx` - Updated to use custom auth
- `frontend/src/lib/axios.js` - Added JWT token interceptor
- `frontend/src/App.jsx` - Removed Supabase Auth dependencies
- `backend/database/migration_add_password_auth.sql` - Database migration

