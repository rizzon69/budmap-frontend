# PostgreSQL Database Setup Guide for BudMap

## Prerequisites

1. **Install PostgreSQL**
   - Download from: https://www.postgresql.org/download/windows/
   - During installation, remember the password you set for the 'postgres' user
   - Default port is 5432 (recommended to keep this)

## Setup Steps

### Step 1: Install PostgreSQL (if not already installed)

1. Download PostgreSQL for Windows
2. Run the installer
3. Follow the installation wizard
4. Set a password for the postgres user (remember this!)
5. Keep the default port 5432
6. Install pgAdmin (included with PostgreSQL) for database management

### Step 2: Create the Database

Open Command Prompt or PowerShell and run:

```bash
# Connect to PostgreSQL (it will ask for password)
psql -U postgres

# Create the database
CREATE DATABASE budmap;

# Exit psql
\q
```

Or use pgAdmin:
1. Open pgAdmin
2. Right-click on "Databases"
3. Click "Create" → "Database"
4. Name it "budmap"
5. Click "Save"

### Step 3: Configure Environment Variables

Edit the `.env` file in the Backend folder and update these values:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=budmap
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here
```

### Step 4: Install Node Dependencies

Open Command Prompt in the Backend folder and run:

```bash
cd C:\fyp\Backend
npm install
```

This will install the PostgreSQL driver (pg) and other dependencies.

### Step 5: Run the Migration

Run the migration script to create tables and populate initial data:

```bash
npm run migrate
```

Or directly:

```bash
node database/migrate.js
```

You should see output like:
```
🚀 Starting database migration...
📋 Creating database schema...
✅ Schema created successfully
📦 Migrating organizations...
✅ Migrated 2 organizations
...
✨ Migration completed successfully!
```

### Step 6: Verify the Setup

Check if tables were created:

```bash
psql -U postgres -d budmap

# List all tables
\dt

# Check users table
SELECT * FROM users;

# Exit
\q
```

Or use pgAdmin:
1. Expand "budmap" database
2. Expand "Schemas" → "public" → "Tables"
3. Right-click any table → "View/Edit Data" → "All Rows"

### Step 7: Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

## Troubleshooting

### Connection Error

If you get "ECONNREFUSED" error:
1. Make sure PostgreSQL service is running
   - Open Services (Win + R, type "services.msc")
   - Look for "postgresql-x64-XX" service
   - Make sure it's running

### Authentication Error

If you get "password authentication failed":
1. Check your .env file has the correct password
2. Try connecting with psql to verify credentials
3. Reset postgres password if needed

### Database Already Exists Error

If you need to reset the database:

```bash
psql -U postgres

DROP DATABASE budmap;
CREATE DATABASE budmap;
\q

npm run migrate
```

## Database Schema Overview

The migration creates these tables:

1. **organizations** - Store organization information
2. **departments** - Department structure
3. **users** - User accounts and authentication
4. **budget_categories** - Income/expense categories
5. **budgets** - Budget plans
6. **budget_allocations** - Budget distribution by category
7. **transactions** - Financial transactions
8. **notifications** - User notifications
9. **activity_logs** - Audit trail
10. **messages** - Internal messaging
11. **password_resets** - Password recovery tokens
12. **email_verifications** - Email verification tokens

## Default Test Accounts

After migration, these accounts are available:

1. **Admin Account**
   - Email: admin@budmap.com
   - Password: admin123
   - Role: Administrator

2. **Finance Officer**
   - Email: finance@budmap.com
   - Password: finance123
   - Role: Finance Officer

3. **Department Head**
   - Email: department@budmap.com
   - Password: dept123
   - Role: Department Head

4. **Viewer**
   - Email: viewer@budmap.com
   - Password: viewer123
   - Role: Viewer

## Next Steps

1. Update your route files to use PostgreSQL queries instead of the in-memory store
2. Test all API endpoints
3. Update frontend to work with the new backend
4. Consider adding database backups
5. Change default passwords in production

## Useful Commands

```bash
# Run migration
npm run migrate

# Start server
npm start

# Development mode
npm run dev

# Connect to database
psql -U postgres -d budmap

# Backup database
pg_dump -U postgres budmap > backup.sql

# Restore database
psql -U postgres budmap < backup.sql
```

## Important Notes

⚠️ **Security Reminders:**
- Change default passwords before production
- Use strong passwords for database
- Keep .env file secure (never commit to git)
- Enable SSL for production database connections
- Implement proper backup strategy

✅ **Performance Tips:**
- Indexes are already created for common queries
- Use connection pooling (already configured)
- Monitor slow queries
- Regular VACUUM and ANALYZE operations

📚 **Resources:**
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Node.js pg driver: https://node-postgres.com/
- pgAdmin Documentation: https://www.pgadmin.org/docs/
