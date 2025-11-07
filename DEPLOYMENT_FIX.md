# Vercel Deployment Fix

## The Issue
You're getting a permission denied error because Vercel is trying to execute vite directly without proper permissions.

## Solution: Configure Vercel Dashboard Settings

Instead of relying on `vercel.json` for the build, configure it directly in the Vercel Dashboard:

### Step 1: Go to Vercel Project Settings
1. Open your project in Vercel Dashboard
2. Go to **Settings** → **General**

### Step 2: Update Build & Development Settings

**Root Directory**: `./client`

**Build Command**: `npm run build`

**Output Directory**: `dist`

**Install Command**: `npm install`

**Node.js Version**: `18.x` or `20.x` (select from dropdown)

### Step 3: Save and Redeploy

After updating these settings:
1. Click **Save**
2. Go to **Deployments** tab
3. Click the **"..."** menu on the latest deployment
4. Click **Redeploy**

## Alternative: Use Root Directory Approach

If the above doesn't work, try this:

1. **Root Directory**: Leave empty (use root of repo)
2. **Build Command**: `cd client && npm install && npm run build`
3. **Output Directory**: `client/dist`
4. **Install Command**: `cd client && npm install`

## Why This Works

By setting the Root Directory to `./client`, Vercel will:
- Change into the client directory first
- Run all commands from there
- Use the `package.json` in the client directory
- This avoids permission issues with nested paths

## After Deployment

Once deployed successfully:
- Your frontend will be served from the root URL
- Your API will be available at `/api/*` routes
- Make sure environment variables are set correctly

