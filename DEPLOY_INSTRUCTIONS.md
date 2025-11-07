# 🚀 How to Deploy Frontend and Backend to Vercel

## Option 1: Deploy as Single Project (Recommended - Monorepo)

This deploys both frontend and backend together in one Vercel project.

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy to Vercel

1. **Go to Vercel**
   - Visit: https://vercel.com
   - Sign in with GitHub

2. **Import Project**
   - Click **"Add New..."** → **"Project"**
   - Find and select **`nielwalker/gym-core`**
   - Click **"Import"**

3. **Configure Project Settings**
   - **Root Directory**: Leave **EMPTY** (use root of repo)
   - **Framework Preset**: Select **"Other"** or **"Vite"**
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install`

4. **Add Environment Variables**
   Click **"Environment Variables"** and add:

   **For Frontend:**
   ```
   VITE_SUPABASE_URL = your_supabase_project_url
   VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
   VITE_API_URL = /api
   ```
   
   **⚠️ IMPORTANT:** `VITE_API_URL` must be `/api` (relative path) when deploying as a single project. This allows the frontend to call the backend on the same domain, avoiding CORS issues.

   **For Backend:**
   ```
   SUPABASE_URL = your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY = your_supabase_service_role_key
   ```

5. **Deploy**
   - Click **"Deploy"**
   - Wait 2-5 minutes for build to complete

### Step 3: Verify Deployment

- Your app will be live at: `https://your-app-name.vercel.app`
- Frontend: Served from root URL
- Backend API: Available at `https://your-app-name.vercel.app/api/*`

---

## Option 2: Deploy Separately (Two Projects)

Deploy frontend and backend as separate Vercel projects.

### Deploy Backend First

1. **Create Backend Project in Vercel**
   - Click **"Add New..."** → **"Project"**
   - Import `nielwalker/gym-core`
   - **Root Directory**: Set to `backend`
   - **Framework Preset**: Other
   - **Build Command**: Leave empty (no build needed)
   - **Output Directory**: Leave empty

2. **Add Environment Variables for Backend:**
   ```
   SUPABASE_URL = your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY = your_supabase_service_role_key
   ```

3. **Deploy Backend**
   - Click "Deploy"
   - Copy the deployment URL (e.g., `https://gym-core-backend.vercel.app`)

### Deploy Frontend

1. **Create Frontend Project in Vercel**
   - Click **"Add New..."** → **"Project"**
   - Import `nielwalker/gym-core` (same repo)
   - **Root Directory**: Set to `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

2. **Add Environment Variables for Frontend:**
   ```
   VITE_SUPABASE_URL = your_supabase_project_url
   VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
   VITE_API_URL = https://gym-core-backend.vercel.app/api
   ```
   (Use the backend URL you copied in Step 3 above)

3. **Deploy Frontend**
   - Click "Deploy"
   - Your frontend will be live at: `https://gym-core-frontend.vercel.app`

---

## 📋 What You Need Before Deploying

### 1. Supabase Credentials

Get these from: **Supabase Dashboard → Settings → API**

- **Project URL**: `https://xxxxx.supabase.co`
- **Anon Key**: The `anon` `public` key
- **Service Role Key**: The `service_role` `secret` key

### 2. Database Setup

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `backend/database/QUICK_SETUP.sql`
3. Click "Run" to create all tables

---

## ✅ Recommended: Option 1 (Single Project)

**Why?**
- Simpler setup
- One URL for everything
- Automatic routing (`/api/*` → backend, `/*` → frontend)
- Easier to manage

**The `vercel.json` file already handles this!**

---

## 🔧 Troubleshooting

### If build fails:
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Make sure `frontend/package.json` has build script

### If API doesn't work:
- Verify backend environment variables are set
- Check that `/api/*` routes are working
- Test: `https://your-app.vercel.app/api/test-db`

### If frontend can't connect to API:
- Make sure `VITE_API_URL=/api` (relative path) for single project deployment
- For separate deployments, use full backend URL: `https://your-backend.vercel.app/api`
- Check browser console for errors

### CORS Errors (Cross-Origin Resource Sharing):
- **If deploying as ONE project:** Set `VITE_API_URL=/api` (relative path)
- **If deploying separately:** The backend CORS is now configured to allow all origins
- Make sure to redeploy both frontend and backend after CORS fixes
- Clear browser cache and try again

---

## 🎯 Quick Deploy (Copy-Paste Steps)

1. Push to GitHub
2. Go to vercel.com → Import project
3. Leave Root Directory empty
4. Add environment variables
5. Deploy
6. Done! 🎉

