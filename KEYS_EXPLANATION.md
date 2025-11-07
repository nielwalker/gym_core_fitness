# Supabase Keys: Which One to Use Where?

## Quick Answer:

- **Backend (backend/.env)**: Use **service_role key** ✅
- **Frontend (frontend/.env)**: Use **anon/public key** ✅

## Detailed Explanation:

### 1. **Service Role Key** (for Backend Server)
- **Location**: `backend/.env` as `SUPABASE_SERVICE_ROLE_KEY`
- **Why**: 
  - Bypasses Row Level Security (RLS)
  - Has full database access
  - Needed for admin operations (creating users, managing data)
  - **NEVER expose this in frontend code!**

### 2. **Anon/Public Key** (for Frontend Client)
- **Location**: `frontend/.env` as `VITE_SUPABASE_ANON_KEY`
- **Why**:
  - Safe to expose in client-side code
  - Respects RLS policies
  - Used for user authentication and client-side operations
  - This is the public key that anyone can see

## Your Current Setup:

### ✅ Backend (backend/.env) - CORRECT
```
SUPABASE_URL=https://qbfjtyiqbqvtvmlmzrpx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs... (service_role key)
```

### ⚠️ Frontend (frontend/.env) - NEEDS TO BE CREATED
You need to create `frontend/.env` with:
```
VITE_SUPABASE_URL=https://qbfjtyiqbqvtvmlmzrpx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs... (anon/public key)
```

## How to Get Your Keys:

1. Go to Supabase Dashboard → Settings → API
2. You'll see two keys:
   - **anon public** key → Use for `frontend/.env` (VITE_SUPABASE_ANON_KEY)
   - **service_role** key → Use for `backend/.env` (SUPABASE_SERVICE_ROLE_KEY)

## Security Rules:

✅ **DO**: Use service_role key in backend only
✅ **DO**: Use anon key in frontend
❌ **DON'T**: Put service_role key in frontend code
❌ **DON'T**: Share service_role key publicly

