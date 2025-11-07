# Vercel Deployment Checklist for Gym Core Fitness

## Prerequisites

- [ ] GitHub repository is set up and code is pushed
- [ ] Vercel account created (sign up at https://vercel.com)
- [ ] Supabase project created and configured
- [ ] All database migrations have been run in Supabase

---

## Step 1: Supabase Setup

### 1.1 Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - **KEEP THIS SECRET!**

### 1.2 Database Setup

1. Run all SQL migrations in Supabase SQL Editor:
   - `backend/database/schema.sql`
   - `backend/database/migration_*.sql` files (in order)
   - `backend/database/fix_rls_policies.sql`

2. Verify tables exist:
   - `users`
   - `customers`
   - `products`
   - `sales`
   - `logbook`

3. Create at least one admin user in the `users` table (via Supabase Auth or SQL)

---

## Step 2: Vercel Project Setup

### 2.1 Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. Import from GitHub
4. Select repository: `nielwalker/gym_core_fitness`
5. Click **Import**

### 2.2 Configure Build Settings

**IMPORTANT:** Configure these settings in Vercel:

- **Framework Preset:** Other
- **Root Directory:** `./` (leave empty or use `./`)
- **Build Command:** `cd frontend && npm install && npm run build`
- **Output Directory:** `frontend/dist`
- **Install Command:** `npm install && cd frontend && npm install && cd ../backend && npm install`

**OR** use the root `vercel.json` configuration (already set up).

---

## Step 3: Environment Variables

### 3.1 Add Environment Variables in Vercel

Go to **Project Settings** → **Environment Variables** and add:

#### Frontend Variables (Client-side - prefixed with `VITE_`):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=/api
```

#### Backend Variables (Server-side):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.2 Environment Variable Notes

- **`VITE_` prefix** is required for Vite to expose variables to the client
- **`SUPABASE_SERVICE_ROLE_KEY`** should NEVER be exposed to the client (no `VITE_` prefix)
- **`VITE_API_URL`** should be `/api` for production (relative path works with Vercel routing)
- Set these for **Production**, **Preview**, and **Development** environments

---

## Step 4: Update vercel.json (If Needed)

The root `vercel.json` should be configured correctly. Verify it includes:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist",
        "buildCommand": "npm install && npm run build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/$1"
    }
  ]
}
```

---

## Step 5: Deploy

1. Click **Deploy** in Vercel
2. Wait for the build to complete
3. Check build logs for any errors
4. Once deployed, you'll get a URL like: `https://gym-core-fitness.vercel.app`

---

## Step 6: Post-Deployment Verification

### 6.1 Test the Application

- [ ] Visit your Vercel deployment URL
- [ ] Test login functionality
- [ ] Verify Supabase connection works
- [ ] Test customer registration
- [ ] Test product management
- [ ] Test sales processing
- [ ] Verify admin dashboard works

### 6.2 Check API Endpoints

Test these endpoints:
- `https://your-app.vercel.app/api/health` - Should return `{"status":"ok"}`
- `https://your-app.vercel.app/api/test-db` - Should return database connection status

### 6.3 Verify Environment Variables

- Check browser console for any missing environment variable errors
- Verify API calls are going to `/api` (not external URLs)

---

## Step 7: Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (can take up to 48 hours)

---

## Troubleshooting

### Build Fails

**Issue:** Build command fails
- **Solution:** Check build logs, ensure all dependencies are in `package.json`
- Verify Node.js version compatibility (Vercel uses Node 18.x by default)

**Issue:** Frontend build fails
- **Solution:** Check if `VITE_` environment variables are set
- Verify `frontend/package.json` has correct build script

**Issue:** Backend build fails
- **Solution:** Ensure `backend/index.js` exports the Express app as default
- Check that all backend dependencies are in `backend/package.json`

### API Routes Not Working

**Issue:** `/api/*` routes return 404
- **Solution:** 
  - Verify `vercel.json` routes are configured correctly
  - Check that `backend/index.js` is in the correct location
  - Ensure backend is exported as default: `export default app`

**Issue:** CORS errors
- **Solution:** Backend CORS is already configured to allow all origins, but verify environment variables are set

### Database Connection Issues

**Issue:** "Missing Supabase environment variables"
- **Solution:** 
  - Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in Vercel
  - Check that variables are set for the correct environment (Production/Preview/Development)
  - Redeploy after adding environment variables

**Issue:** "Invalid API key" or authentication errors
- **Solution:**
  - Verify you're using the `service_role` key (not `anon` key) for backend
  - Ensure the key is copied completely (it's a long JWT token)
  - Check Supabase project is active and not paused

### Frontend Can't Connect to API

**Issue:** API calls fail with network errors
- **Solution:**
  - Verify `VITE_API_URL` is set to `/api` (relative path)
  - Check browser console for actual API URL being called
  - Ensure `frontend/src/lib/axios.js` uses `import.meta.env.VITE_API_URL`

---

## Important Security Notes

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to the client
3. **Use `anon` key for client-side** Supabase operations
4. **Use `service_role` key only** in server-side code (backend)
5. **Enable RLS (Row Level Security)** in Supabase for data protection

---

## Quick Reference: Environment Variables Summary

| Variable | Where Used | Value Example |
|----------|-----------|---------------|
| `VITE_SUPABASE_URL` | Frontend | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Frontend | `eyJhbGciOiJIUzI1NiIs...` |
| `VITE_API_URL` | Frontend | `/api` |
| `SUPABASE_URL` | Backend | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | `eyJhbGciOiJIUzI1NiIs...` |

---

## Next Steps After Deployment

1. Set up monitoring and error tracking (optional)
2. Configure automatic deployments from GitHub (enabled by default)
3. Set up preview deployments for pull requests (enabled by default)
4. Configure production and staging environments
5. Set up database backups in Supabase

---

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- Check deployment logs in Vercel Dashboard for detailed error messages

