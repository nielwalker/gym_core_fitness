# Gym Core - Gym Management System

A comprehensive gym management web application built with React, Node.js, Supabase, and Bootstrap.

## Features

- **User Management**: Two types of users (Admin and Staff)
- **Customer Registration**: Register customers with payment tracking
- **Product Management**: Manage gym products and inventory
- **Sales Tracking**: Track product sales and customer registrations
- **Log Book**: Record walk-in customers
- **Revenue Tracking**: Monitor daily revenue from multiple sources
- **Date-based Filtering**: View records by specific dates

## Tech Stack

- **Frontend**: React, Vite, Bootstrap, React Router
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nielwalker/gym-core.git
   cd gym-core
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**

   Create `frontend/.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=http://localhost:8080/api
   ```

   Create `backend/.env`:
   ```
   PORT=8080
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Set up Supabase database**
   - Go to your Supabase project
   - Open SQL Editor
   - Run the SQL script from `backend/database/QUICK_SETUP.sql`

5. **Run the application**
   ```bash
   npm run dev
   ```

   This will start:
   - Client on http://localhost:5173
   - Server on http://localhost:8080

## Default Admin Account

- **Username**: `admin`
- **Password**: `adminpassword`

## Project Structure

```
gym-core/
├── frontend/        # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   └── package.json
├── backend/         # Node.js backend
│   ├── index.js
│   ├── package.json
│   └── database/    # Database setup scripts
└── vercel.json      # Vercel configuration
```

## Deployment

See `VERCEL_DEPLOYMENT.md` for detailed deployment instructions.

## License

ISC
