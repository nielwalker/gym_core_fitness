# How to Fix "Invalid API key" Error

## Step 1: Get Your Supabase Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (gear icon) in the left sidebar
4. Click **API** in the settings menu
5. Scroll down to find **Project API keys**
6. Find the **service_role** key (it's the secret one, NOT the anon key)
7. Click the **Copy** button next to the service_role key

## Step 2: Update server/.env File

1. Open the file: `server/.env`
2. Find the line: `SUPABASE_SERVICE_ROLE_KEY=...`
3. Replace the value with your actual service_role key from Step 1
4. Make sure there are no spaces or quotes around the key
5. Save the file

The file should look like this:
```
PORT=5000
SUPABASE_URL=https://qbfjtyiqbqvtvmlmzrpx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmp0eWlxYnF2dHZtbG16cnB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQzNDA2OSwiZXhwIjoyMDc4MDEwMDY5fQ.OhF1sOUbu6VsfZAWm4B8i0J2EoiLxuRwlhqa9ENpMZg
```

## Step 3: Restart Your Server

After updating the .env file:

1. Stop your server (Ctrl+C in the terminal)
2. Start it again:
   ```bash
   cd server
   npm start
   ```

## Important Notes:

- **NEVER** share your service_role key publicly
- The service_role key is different from the anon key
- Make sure you copy the ENTIRE key (it's a long JWT token)
- The key should start with `eyJ` and be very long

## Verify Your Setup:

After restarting, test if it works:
1. Try adding a product again
2. If you still get errors, check the server console for detailed error messages

