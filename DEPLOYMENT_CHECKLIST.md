# Vercel Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Project Structure
- ✅ `frontend/` folder with all React files
- ✅ `backend/` folder with Express server
- ✅ `vercel.json` configured correctly
- ✅ All package.json files present

### 2. Environment Variables Required

**In Vercel Dashboard → Settings → Environment Variables, add:**

#### Frontend Variables (VITE_ prefix):
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=/api
```

#### Backend Variables:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Vercel Project Settings

**When importing project in Vercel:**

1. **Root Directory**: Leave empty (use root of repo)
2. **Framework Preset**: Other
3. **Build Command**: `cd frontend && npm install && npm run build`
4. **Output Directory**: `frontend/dist`
5. **Install Command**: `cd frontend && npm install`

**OR use the vercel.json configuration (recommended)**

### 4. Database Setup

- ✅ Run `backend/database/QUICK_SETUP.sql` in Supabase SQL Editor
- ✅ Verify all tables are created
- ✅ Check RLS policies are set correctly

### 5. Files Verification

- ✅ `backend/index.js` - Server file with all endpoints
- ✅ `backend/package.json` - Backend dependencies
- ✅ `frontend/package.json` - Frontend dependencies
- ✅ `frontend/vite.config.js` - Vite configuration
- ✅ `vercel.json` - Vercel configuration

## 🚀 Deployment Steps

1. **Push to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push
   ```

2. **Import to Vercel**
   - Go to https://vercel.com
   - Click "Add New..." → "Project"
   - Import from GitHub: `nielwalker/gym-core`

3. **Configure Environment Variables**
   - Add all required environment variables (see above)

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

## ⚠️ Important Notes

- The `vercel.json` file handles both frontend and backend
- API routes (`/api/*`) will be handled by serverless functions
- Frontend routes will serve the React app
- Make sure `VITE_API_URL=/api` (relative path) for production

## 🔍 Post-Deployment Verification

1. Visit your Vercel URL
2. Test login functionality
3. Verify API endpoints work (`/api/test-db`)
4. Check that Supabase connection is working
5. Test all features (register customer, add product, etc.)

