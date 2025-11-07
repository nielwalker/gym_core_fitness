# Vercel Deployment - Quick Start Guide

## 🚀 Quick Setup Steps

### 1. Supabase Credentials
Get these from Supabase Dashboard → Settings → API:
- Project URL
- anon/public key
- service_role key (secret!)

### 2. Deploy to Vercel

1. **Go to Vercel Dashboard** → Add New Project
2. **Import from GitHub**: `nielwalker/gym_core_fitness`
3. **Configure Build Settings:**
   - Framework: Other
   - Root Directory: `./` (or leave empty)
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`

4. **Add Environment Variables:**

   **Frontend (Client):**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_API_URL=/api
   ```

   **Backend (Server):**
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

5. **Deploy!** 🎉

### 3. Verify Deployment

- Visit your Vercel URL
- Test: `https://your-app.vercel.app/api/health`
- Test login and features

## ⚠️ Important Notes

- ✅ `VITE_` prefix is required for frontend variables
- ✅ `VITE_API_URL` should be `/api` (relative path)
- ❌ Never expose `SUPABASE_SERVICE_ROLE_KEY` to client
- ✅ Backend routes are at `/api/*`

## 📋 Full Checklist

See `VERCEL_DEPLOYMENT_CHECKLIST.md` for complete details.

