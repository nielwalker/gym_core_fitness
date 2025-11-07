# Vercel Deployment Guide for Gym Core

## ✅ Code is now on GitHub!
Your code has been successfully pushed to: `https://github.com/nielwalker/gym-core.git`

## 🚀 Deploy to Vercel - Step by Step

### Step 1: Sign up/Login to Vercel
1. Go to https://vercel.com
2. Click "Sign Up" or "Log In"
3. **Recommended**: Sign in with GitHub (makes deployment easier)

### Step 2: Import Your Project
1. In Vercel Dashboard, click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. Find and select **`nielwalker/gym-core`**
4. Click **"Import"**

### Step 3: Configure Project Settings

**IMPORTANT CONFIGURATION:**

1. **Framework Preset**: Select **"Vite"** (or "Other" if Vite is not available)

2. **Root Directory**: Click "Edit" and set to: **`./frontend`**
   - This tells Vercel where your frontend code is

3. **Build Command**: `npm run build`
   - This builds your React app

4. **Output Directory**: `dist`
   - This is where Vite outputs the built files

5. **Install Command**: `npm install`
   - This installs dependencies

### Step 4: Add Environment Variables

Click **"Environment Variables"** and add the following:

#### For Client (Frontend):
```
VITE_SUPABASE_URL = your_supabase_project_url
VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
VITE_API_URL = /api
```

#### For Server (Backend):
```
SUPABASE_URL = your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY = your_supabase_service_role_key
```

**Important Notes:**
- Replace `your_supabase_project_url` with your actual Supabase URL
- Replace `your_supabase_anon_key` with your actual Supabase anon/public key
- Replace `your_supabase_service_role_key` with your actual service_role key
- The `VITE_` prefix is required for Vite to expose variables to the client
- `VITE_API_URL` should be `/api` (relative path) for production

### Step 5: Configure Serverless Functions

Since you have a Node.js backend, you need to configure it:

1. In the project settings, go to **"Functions"**
2. The `vercel.json` file should automatically configure:
   - `/api/*` routes → `backend/index.js` (serverless function)
   - All other routes → React app

### Step 6: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually 2-5 minutes)
3. Once deployed, you'll get a URL like: `https://gym-core.vercel.app`

## 📋 What You Need to Provide

Before deploying, make sure you have:

1. **Supabase Project URL**
   - Found in: Supabase Dashboard → Project Settings → API → Project URL

2. **Supabase Anon Key**
   - Found in: Supabase Dashboard → Project Settings → API → Project API keys → `anon` `public`

3. **Supabase Service Role Key**
   - Found in: Supabase Dashboard → Project Settings → API → Project API keys → `service_role` `secret`
   - ⚠️ **Keep this secret!** Never expose it to the client

## 🔧 Post-Deployment Configuration

After deployment:

1. **Update API URL** (if needed):
   - Your API will be available at: `https://your-app.vercel.app/api`
   - The `VITE_API_URL=/api` should work automatically

2. **Test the Application**:
   - Visit your Vercel URL
   - Try logging in with admin credentials
   - Test all features

3. **Verify Supabase Connection**:
   - Make sure your Supabase database is properly set up
   - Run the SQL script from `backend/database/QUICK_SETUP.sql` if you haven't already

## 🐛 Troubleshooting

### If deployment fails:
- Check build logs in Vercel dashboard
- Verify all environment variables are set correctly
- Ensure `package.json` files are correct

### If API routes don't work:
- Verify `vercel.json` is in the root directory
- Check that serverless functions are deployed
- Ensure environment variables for server are set

### If Supabase connection fails:
- Double-check environment variables
- Verify Supabase project is active
- Check RLS policies in Supabase

## 📝 Additional Notes

- **Free Tier**: Vercel free tier is perfect for this project
- **Automatic Deployments**: Every push to `main` branch will auto-deploy
- **Preview Deployments**: Pull requests get preview URLs automatically
- **Custom Domain**: You can add a custom domain in Project Settings → Domains

## 🎉 You're Done!

Once deployed, your app will be live at: `https://your-app-name.vercel.app`

The app will automatically redeploy whenever you push changes to GitHub!

