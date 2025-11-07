# What's in the `supabase/` Folder?

## Contents

The `supabase/` folder contains **database setup and migration scripts**:

1. **QUICK_SETUP.sql** - Main setup script (creates all tables, RLS policies)
2. **schema.sql** - Database schema definition
3. **setup_database.sql** - Alternative setup script
4. **Migration files:**
   - `migration_update_customers.sql` - Adds columns to customers table
   - `migration_add_user_fields.sql` - Adds name/username to users table
   - `migration_create_logbook.sql` - Creates logbook table
   - `migration_add_staff_tracking.sql` - Adds staff_id tracking
   - `fix_rls_policies.sql` - Fixes Row Level Security policies
5. **README.md** - Setup instructions

## What These Files Do

These are **SQL scripts** that you run **once** in the Supabase SQL Editor to:
- Create database tables (users, customers, products, sales, logbook)
- Set up Row Level Security (RLS) policies
- Create indexes for performance
- Add columns and migrations

## Should They Be in Backend?

### Option 1: Keep Separate (Current - Recommended)
**Pros:**
- Clear separation: Database setup vs Application code
- Easy to find database-related files
- Common practice in many projects
- Database migrations are often separate from app code

**Cons:**
- Extra folder in root

### Option 2: Move to Backend
**Pros:**
- Cleaner root directory (only frontend/backend)
- Database setup is related to backend

**Cons:**
- Mixes database setup with application code
- Less clear separation of concerns

## Recommendation

**Keep it separate** - The `supabase/` folder is for database setup scripts, not application code. It's a common pattern to keep database migrations/setup scripts separate from the application code.

However, if you want a cleaner structure with only `frontend/` and `backend/`, you can move it to `backend/database/` or `backend/supabase/`.

## Current Structure (Recommended)
```
GYM_CORE/
├── frontend/     # React app
├── backend/      # Express server
└── supabase/     # Database setup scripts
```

## Alternative Structure (If You Want Only 2 Folders)
```
GYM_CORE/
├── frontend/     # React app
└── backend/      # Express server
    └── database/ # Database setup scripts (moved from supabase/)
```

