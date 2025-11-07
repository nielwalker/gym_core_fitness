# Supabase Authentication Setup

## Overview

The application uses **Supabase Authentication** for staff accounts. This means:
- ✅ Staff accounts are created in Supabase Auth
- ✅ Email is auto-confirmed (no email confirmation needed)
- ✅ Email is hidden from UI (users only see username)
- ✅ Login uses username (email is automatically formatted)

## How It Works

### Registration
1. Admin creates staff account with name, username, and password
2. Backend creates user in Supabase Auth with email format: `username@gymcore.com`
3. Email is auto-confirmed so user can login immediately
4. User record created in database via trigger
5. Name and username saved to database

### Login
1. User enters username and password
2. System automatically formats email as `username@gymcore.com`
3. Supabase Auth verifies credentials
4. User is logged in

### Email Handling
- Email is **required by Supabase Auth** (internal requirement)
- Email format: `username@gymcore.com` (automatically generated)
- Email is **hidden from users** - they only see and use username
- Email is **auto-confirmed** - no confirmation needed

## Database Setup

The database uses Supabase Auth triggers:

1. When a user is created in `auth.users`, a trigger automatically creates a record in `public.users`
2. The trigger extracts `name` and `username` from user metadata
3. Email is stored but not displayed in the UI

## No Migration Needed

If you're using the existing setup, no migration is needed. The system works with:
- Supabase Auth for authentication
- Email auto-confirmation
- Username-based login (email hidden from users)

## Benefits

- ✅ Secure authentication via Supabase
- ✅ No email confirmation needed
- ✅ Users only see username (email is hidden)
- ✅ Automatic session management
- ✅ Built-in security features

