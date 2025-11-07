# CORS Error Fix - Complete Solution

## Problem
You're getting CORS errors because frontend and backend are deployed on different Vercel URLs:
- Frontend: `https://gym-core-main-bw1u9331c-nielwalkers-projects.vercel.app`
- Backend: `https://gym-core-lv10rj0nx-nielwalkers-projects.vercel.app`

## Solution 1: Deploy as ONE Project (RECOMMENDED) ✅

This is the best solution. Deploy frontend and backend together in a single Vercel project.

### Steps:

1. **Delete your current separate deployments** (optional, but recommended)

2. **Create ONE new project in Vercel:**
   - Go to Vercel Dashboard
   - Click "Add New..." → "Project"
   - Import `nielwalker/gym-core`
   - **Root Directory**: Leave **EMPTY** (use root)
   - **Framework Preset**: Other
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install`

3. **Add Environment Variables:**
   ```
   VITE_SUPABASE_URL = your_supabase_url
   VITE_SUPABASE_ANON_KEY = your_anon_key
   VITE_API_URL = /api
   SUPABASE_URL = your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY = your_service_role_key
   ```

4. **Deploy**

5. **Result:**
   - Frontend: `https://your-app.vercel.app`
   - Backend API: `https://your-app.vercel.app/api/*`
   - No CORS issues! ✅

---

## Solution 2: Keep Separate Deployments (Alternative)

If you want to keep frontend and backend separate, follow these steps:

### Backend Deployment:

1. **Update Environment Variables in Backend Project:**
   - Go to your backend project settings
   - Add/Update:
   ```
   SUPABASE_URL = your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY = your_service_role_key
   ```

2. **Redeploy Backend** (CORS is now fixed in the code)

### Frontend Deployment:

1. **Update Environment Variables in Frontend Project:**
   - Go to your frontend project settings
   - Update `VITE_API_URL` to your backend URL:
   ```
   VITE_API_URL = https://gym-core-lv10rj0nx-nielwalkers-projects.vercel.app
   ```

2. **Redeploy Frontend**

---

## What Was Fixed:

✅ **CORS Configuration Updated:**
- Added explicit CORS headers to all responses
- Handles preflight (OPTIONS) requests properly
- Allows all origins (for Vercel deployments)
- Supports all HTTP methods (GET, POST, PUT, DELETE, OPTIONS)

✅ **Backend Code Updated:**
- `backend/index.js` now has comprehensive CORS handling
- All API endpoints will include proper CORS headers

---

## After Fixing:

1. **Commit and push the changes:**
   ```bash
   git add .
   git commit -m "Fix CORS configuration"
   git push
   ```

2. **Redeploy on Vercel:**
   - If using Solution 1: Redeploy the single project
   - If using Solution 2: Redeploy both frontend and backend

3. **Test the application:**
   - Try adding a product
   - Check if API calls work
   - Verify no CORS errors in console

---

## Verification:

After deployment, check the browser console. You should see:
- ✅ No CORS errors
- ✅ API calls succeeding
- ✅ Products loading correctly
- ✅ All features working

---

## Need Help?

If you still see CORS errors after following these steps:
1. Clear browser cache
2. Check that environment variables are set correctly
3. Verify both projects are redeployed
4. Check Vercel deployment logs for errors

