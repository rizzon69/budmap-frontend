# BudMap PostgreSQL Database Setup - Complete Guide

## 🎯 What Has Been Created

I've set up a complete PostgreSQL database infrastructure for your BudMap application:

### Files Created:

1. **`Backend/database/config.js`** - Database connection configuration
2. **`Backend/database/schema.sql`** - Complete database schema with all tables
3. **`Backend/database/migrate.js`** - Migration script to create tables and import data
4. **`Backend/database/test-connection.js`** - Connection testing utility
5. **`Backend/database/SETUP_GUIDE.md`** - Detailed setup instructions
6. **`Backend/.env`** - Updated environment variables
7. **`Backend/package.json`** - Updated with PostgreSQL driver
8. **`setup-database.bat`** - Automated setup script for Windows

## 📋 Quick Setup Instructions

### Prerequisites

1. **PostgreSQL must be installed**
   - Download: https://www.postgresql.org/download/windows/
   - Version 12 or higher recommended
   - Remember the password you set for 'postgres' user

### Step-by-Step Setup

#### 1. Install PostgreSQL (if not installed)

Download and install PostgreSQL from the official website. During installation:
- Set a strong password for 'postgres' user
- Use default port 5432
- Install pgAdmin for database management

#### 2. Create the Database

**Option A - Using Command Line:**
```bash
# Open Command Prompt and run:
psql -U postgres

# In psql, run:
CREATE DATABASE budmap;

# Exit psql:
\q
```

**Option B - Using pgAdmin:**
1. Open pgAdmin
2. Right-click "Databases" → "Create" → "Database"
3. Name: `budmap`
4. Click "Save"

#### 3. Configure Database Credentials

Edit `Backend/.env` and update these lines with your PostgreSQL password:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=budmap
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
```

#### 4. Run Automated Setup

**Option A - Use the Batch File (Easiest):**
```bash
# Double-click or run:
setup-database.bat
```

**Option B - Manual Setup:**
```bash
# Navigate to Backend folder
cd C:\fyp\Backend

# Install dependencies
npm install

# Test connection
npm run db:test

# Run migration
npm run migrate
```

#### 5. Verify Setup

Check if everything worked:

```bash
cd Backend
npm run db:test
```

You should see:
- ✅ Connection successful
- List of created tables
- Data counts for each table

## 🗄️ Database Schema

The setup creates these tables:

| Table | Description |
|-------|-------------|
| `organizations` | Organization information (NGOs, SMEs, Educational) |
| `departments` | Organizational departments |
| `users` | User accounts with roles |
| `budget_categories` | Income/expense categories |
| `budgets` | Budget plans and allocations |
| `budget_allocations` | Budget distribution by category |
| `transactions` | Financial transactions |
| `notifications` | User notifications |
| `activity_logs` | Audit trail |
| `messages` | Internal messaging system |
| `password_resets` | Password recovery tokens |
| `email_verifications` | Email verification tokens |

## 👥 Default Test Accounts

After migration, you can login with:

| Email | Password | Role |
|-------|----------|------|
| admin@budmap.com | admin123 | Administrator |
| finance@budmap.com | finance123 | Finance Officer |
| department@budmap.com | dept123 | Department Head |
| viewer@budmap.com | viewer123 | Viewer |

⚠️ **Change these passwords before going to production!**

## 📊 Sample Data Included

The migration imports:
- 2 Organizations
- 4 Departments  
- 4 Users
- 12 Budget Categories
- 4 Budgets (Total: ₹5,000,000)
- 6 Budget Allocations
- 6 Transactions
- 3 Notifications
- 2 Activity Logs

## 🔧 Available Commands

```bash
# Test database connection
npm run db:test

# Run migration (create tables + import data)
npm run migrate

# Start server
npm start

# Development mode (auto-reload)
npm run dev
```

## 🐛 Troubleshooting

### Error: ECONNREFUSED

**Problem:** Can't connect to PostgreSQL

**Solutions:**
1. Check if PostgreSQL is running:
   - Press Win+R, type `services.msc`
   - Look for "postgresql-x64-XX" service
   - Make sure it's running

2. Verify credentials in `.env` file
3. Check firewall settings

### Error: Database does not exist

**Problem:** Database 'budmap' not found

**Solution:**
```bash
psql -U postgres -c "CREATE DATABASE budmap;"
```

### Error: Authentication failed

**Problem:** Wrong username or password

**Solution:**
1. Check `.env` file has correct password
2. Verify you can login with psql:
   ```bash
   psql -U postgres
   ```
3. Reset password if needed

### Need to Reset Database

If you want to start fresh:

```bash
# Connect to PostgreSQL
psql -U postgres

# Drop and recreate database
DROP DATABASE budmap;
CREATE DATABASE budmap;
\q

# Run migration again
cd Backend
npm run migrate
```

## 🚀 Next Steps

After successful setup:

1. **Update Route Files** - Modify your route files to use PostgreSQL queries instead of the in-memory store

2. **Test API Endpoints** - Verify all endpoints work with the database

3. **Update Frontend** - Ensure frontend works with the new backend

4. **Security**:
   - Change default passwords
   - Add `.env` to `.gitignore`
   - Use environment variables for production

5. **Backups**:
   ```bash
   # Create backup
   pg_dump -U postgres budmap > backup.sql
   
   # Restore backup
   psql -U postgres budmap < backup.sql
   ```

## 📚 Database Documentation

### Connection Pooling

The database uses connection pooling for better performance:
- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

### Indexes

Indexes are automatically created for:
- User email lookup
- Organization and department relationships
- Budget and transaction queries
- Date-based searches
- Notification status

### Automatic Updates

Triggers automatically update `updated_at` timestamps for:
- Organizations
- Departments
- Users
- Budgets
- Budget Allocations
- Transactions

## 🔐 Security Notes

⚠️ **Important Security Reminders:**

1. **Never commit `.env` file to Git**
2. **Change default passwords immediately**
3. **Use strong database passwords**
4. **Enable SSL in production**
5. **Implement regular backups**
6. **Monitor database access logs**

## 📞 Support

If you encounter issues:

1. Check `Backend/database/SETUP_GUIDE.md` for detailed instructions
2. Run `npm run db:test` to diagnose connection issues
3. Check PostgreSQL logs in data directory
4. Verify all prerequisites are met

## 🎓 Learning Resources

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Node.js pg Driver: https://node-postgres.com/
- pgAdmin Tutorial: https://www.pgadmin.org/docs/
- SQL Tutorial: https://www.postgresql.org/docs/current/tutorial.html

---

**Current Status:** ✅ Database setup files created and ready to use

**Action Required:** 
1. Install PostgreSQL (if not installed)
2. Create `budmap` database
3. Update `.env` with your password
4. Run `setup-database.bat` or manual setup commands

Good luck with your BudMap project! 🚀
