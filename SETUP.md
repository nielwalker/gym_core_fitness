# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm run install:all
```

This will install dependencies for root, frontend, and backend.

## Step 2: Set Up Supabase

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the project to be ready

2. **Run Database Schema:**
   - Go to SQL Editor in Supabase dashboard
   - Copy the entire contents of `backend/database/QUICK_SETUP.sql`
   - Paste and run it

3. **Get API Keys:**
   - Go to Settings > API
   - Copy:
     - Project URL
     - `anon` public key
     - `service_role` key (keep this secret!)

## Step 3: Configure Environment Variables

### Frontend (`frontend/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:5000/api
```

### Backend (`backend/.env`)
```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 4: Create Admin User

1. **Enable Email Auth in Supabase:**
   - Go to Authentication > Providers
   - Enable Email provider

2. **Create a user:**
   - Go to Authentication > Users
   - Click "Add user" or sign up through your app

3. **Make user admin:**
   - Go to SQL Editor
   - Run:
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'your-email@example.com';
   ```

## Step 5: Run the Application

```bash
npm run dev
```

This will start:
- Frontend on http://localhost:3000
- Backend on http://localhost:5000

## Step 6: Test the Application

1. Go to http://localhost:3000
2. Login with your admin credentials
3. Test the features:
   - Register a customer
   - Add a product
   - Process a sale
   - View admin dashboard

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure you created `.env` files in both `frontend/` and `backend/` directories
- Check that variable names match exactly (case-sensitive)

### "Failed to login"
- Verify your Supabase credentials are correct
- Check that email authentication is enabled in Supabase
- Make sure the user exists in Supabase Auth

### "Cannot connect to API"
- Ensure the backend server is running on port 5000
- Check that `VITE_API_URL` in frontend/.env points to the correct backend URL

### Database errors
- Verify you ran the schema.sql in Supabase SQL Editor
- Check that all tables were created successfully
- Ensure RLS policies are in place

## Next Steps

After local setup is working:
1. Review `DEPLOYMENT.md` for Vercel deployment instructions
2. Set up your production environment variables
3. Deploy to Vercel

