# Deployment Guide for Gym Core

## Vercel Deployment (Recommended)

### Option 1: Deploy Frontend and Backend Separately (Recommended)

#### Deploy Backend (Server)

1. **Create a new Vercel project for the backend:**
   ```bash
   cd backend
   vercel
   ```

2. **Set environment variables in Vercel dashboard:**
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

3. **Update vercel.json in server directory:**
   Create `server/vercel.json`:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/index.js"
       }
     ]
   }
   ```

#### Deploy Frontend (Client)

1. **Create a new Vercel project for the frontend:**
   ```bash
   cd frontend
   vercel
   ```

2. **Set environment variables in Vercel dashboard:**
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `VITE_API_URL` - Your backend API URL (e.g., `https://your-backend.vercel.app/api`)

3. **Build settings:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Option 2: Deploy as Monorepo (Alternative)

1. **Push code to GitHub**

2. **Import project in Vercel:**
   - Go to Vercel dashboard
   - Click "New Project"
   - Import your GitHub repository

3. **Configure build settings:**
   - Root Directory: Leave empty
   - Framework Preset: Other
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `npm run install:all`

4. **Set environment variables:**
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (set this after backend is deployed)

5. **Create API routes:**
   - You may need to convert the Express server to Vercel serverless functions
   - Or deploy backend separately and use `VITE_API_URL`

## Post-Deployment Checklist

- [ ] Verify Supabase database schema is set up
- [ ] Create at least one admin user in Supabase
- [ ] Test login functionality
- [ ] Test customer registration
- [ ] Test product management
- [ ] Test sales processing
- [ ] Verify admin dashboard works
- [ ] Check that all API endpoints are accessible

## Troubleshooting

### CORS Issues
If you encounter CORS errors, make sure:
- Backend CORS is configured to allow your frontend domain
- Environment variables are set correctly

### API Not Found
- Verify `VITE_API_URL` is set correctly in frontend environment variables
- Check that backend is deployed and accessible
- Ensure API routes are correctly configured

### Authentication Issues
- Verify Supabase environment variables are correct
- Check that RLS policies are set up correctly
- Ensure users table has the correct structure

