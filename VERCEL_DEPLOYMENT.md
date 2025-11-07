# Vercel Deployment Guide for Gym Core

## Prerequisites
1. GitHub account with the repository pushed
2. Vercel account (sign up at https://vercel.com - it's free)
3. Supabase project with all environment variables ready

## Step 1: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com
   - Sign in or create an account (use GitHub to sign in for easier integration)

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Import from GitHub
   - Select the repository: `nielwalker/gym-core`
   - Click "Import"

3. **Configure Project Settings**
   - **Framework Preset**: Vite
   - **Root Directory**: `./frontend` (IMPORTANT!)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   You'll need to add these environment variables in Vercel:
   
   **For Client (Frontend):**
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key
   - `VITE_API_URL` - Leave empty or set to `/api` (Vercel will handle routing)

   **For Server (Backend/API):**
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service_role key (IMPORTANT: Keep this secret!)
   - `PORT` - Leave empty (Vercel will set this automatically)

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   Follow the prompts to configure your project.

## Step 2: Configure Vercel for Monorepo Structure

Since your project has both client and server, you need to configure Vercel properly:

### Update vercel.json (Already done)
The `vercel.json` file has been configured to:
- Build the client (React app)
- Deploy the server as serverless functions
- Route `/api/*` requests to the server
- Serve the React app for all other routes

## Step 3: Environment Variables Setup

### In Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the following:

**For Production:**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=/api
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important Notes:**
- The `VITE_` prefix is required for Vite to expose these variables to the client
- `SUPABASE_SERVICE_ROLE_KEY` should NEVER be exposed to the client
- `VITE_API_URL` should be `/api` for production (Vercel will route it automatically)

## Step 4: Update API Configuration

After deployment, you'll need to update the client's API URL:

1. In Vercel, go to your project
2. Copy your deployment URL (e.g., `https://gym-core.vercel.app`)
3. The API will be available at `https://gym-core.vercel.app/api`

The `VITE_API_URL` should be set to `/api` (relative path) so it works with your Vercel deployment.

## Step 5: Verify Deployment

1. Visit your Vercel deployment URL
2. Test the login functionality
3. Verify API endpoints are working
4. Check that Supabase connection is working

## Troubleshooting

### If API routes don't work:
- Make sure `vercel.json` is in the root directory
- Verify the serverless function is deployed (check Vercel Functions tab)
- Check that environment variables are set correctly

### If build fails:
- Check the build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### If Supabase connection fails:
- Double-check environment variables are set correctly
- Verify Supabase project is active
- Check RLS policies in Supabase

## Additional Configuration

### Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Environment-Specific Variables
You can set different variables for:
- Production
- Preview (for pull requests)
- Development

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Ensure Supabase database is properly configured
4. Check that all migrations have been run in Supabase

