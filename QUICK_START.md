# 🚀 Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works)

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Set Up Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Run `backend/database/QUICK_SETUP.sql` in SQL Editor
3. Get your API keys from Settings > API

### 3. Create Environment Files

**`frontend/.env`:**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:8080/api
```

**`backend/.env`:**
```
PORT=8080
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Create Admin User
1. Sign up through the app or create user in Supabase Auth
2. Run in SQL Editor:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 5. Start Development
```bash
npm run dev
```

Visit http://localhost:3000 and login!

## What's Included

✅ **Staff Features:**
- Customer registration
- Product management (CRUD)
- Sales processing

✅ **Admin Features:**
- Sales tracking & analytics
- User management
- Dashboard with statistics

✅ **Tech Stack:**
- React 18 + Vite
- Node.js + Express
- Supabase (PostgreSQL + Auth)
- Bootstrap 5

## Need Help?

- See `SETUP.md` for detailed setup
- See `DEPLOYMENT.md` for Vercel deployment
- See `README.md` for full documentation

