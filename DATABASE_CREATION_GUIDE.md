# 🗄️ BudMap Database Creation Guide

## ✅ Files Created

I've created these files to help you set up the database:

1. **`Backend/database/create-database.sql`** - Complete SQL script
2. **`create-budmap-database.bat`** - Automated setup script
3. **This guide** - Step-by-step instructions

---

## 🚀 Quick Setup (Choose One Method)

### **Method 1: Automated Setup (Easiest)** ⭐

1. **Double-click this file:**
   ```
   C:\fyp\create-budmap-database.bat
   ```

2. **Enter your PostgreSQL password when prompted**

3. **Done!** The database will be created automatically.

---

### **Method 2: Manual Setup**

#### **Step 1: Open Command Prompt**
- Press `Win + R`
- Type `cmd`
- Press Enter

#### **Step 2: Navigate to the project**
```bash
cd C:\fyp\Backend\database
```

#### **Step 3: Run the SQL script**
```bash
psql -U postgres -f create-database.sql
```

#### **Step 4: Enter your PostgreSQL password**

#### **Step 5: Verify**
You should see:
```
BudMap Database Created Successfully!
Database: budmap
Tables: 12
Indexes: 18
Triggers: 6
```

---

### **Method 3: Using pgAdmin (Visual)**

1. **Open pgAdmin 4**

2. **Connect to PostgreSQL**
   - Expand "Servers"
   - Click "PostgreSQL"
   - Enter your password

3. **Open Query Tool**
   - Right-click "PostgreSQL"
   - Click "Query Tool"

4. **Open SQL file**
   - Click folder icon
   - Browse to: `C:\fyp\Backend\database\create-database.sql`
   - Click Open

5. **Execute**
   - Press F5 or click Execute button
   - Database will be created!

---

## 🗂️ What Gets Created

### **Database**
- Name: `budmap`
- Owner: `postgres`
- Encoding: UTF8

### **Tables (12)**
1. ✅ `organizations` - NGOs, SMEs, Educational institutions
2. ✅ `departments` - Organizational departments
3. ✅ `users` - User accounts with roles
4. ✅ `budget_categories` - Income/expense categories
5. ✅ `budgets` - Budget plans
6. ✅ `budget_allocations` - Budget distribution
7. ✅ `transactions` - Financial transactions
8. ✅ `notifications` - User notifications
9. ✅ `activity_logs` - Audit trail
10. ✅ `messages` - Internal messaging
11. ✅ `password_resets` - Password recovery
12. ✅ `email_verifications` - Email verification

### **Indexes (18)**
- Primary keys on all tables
- Foreign key indexes
- Search optimization indexes
- Date-based indexes

### **Triggers (6)**
- Automatic timestamp updates
- Data validation

---

## 🔍 Verify Database Creation

### **Check if database exists:**
```bash
psql -U postgres -c "\l budmap"
```

### **Check tables:**
```bash
psql -U postgres -d budmap -c "\dt"
```

You should see all 12 tables listed.

---

## ❌ Troubleshooting

### **Error: "password authentication failed"**

**Solution:**
1. You entered the wrong password
2. Try again with the correct password
3. If you forgot, see: `RESET_POSTGRES_PASSWORD.md`

---

### **Error: "psql: command not found"**

**Solution:**
1. PostgreSQL bin folder is not in PATH
2. **Option A:** Add to PATH
   - Go to: `Control Panel > System > Environment Variables`
   - Add: `C:\Program Files\PostgreSQL\16\bin`
   
3. **Option B:** Use full path
   ```bash
   "C:\Program Files\PostgreSQL\16\bin\psql" -U postgres -f create-database.sql
   ```

---

### **Error: "database already exists"**

**Solution:**
The database already exists! You can either:

**Option A:** Drop and recreate
```bash
psql -U postgres -c "DROP DATABASE budmap;"
psql -U postgres -f create-database.sql
```

**Option B:** Keep existing and just run migration
```bash
cd C:\fyp\Backend
npm run migrate
```

---

### **Error: "PostgreSQL service not running"**

**Solution:**
1. Press `Win + R`
2. Type: `services.msc`
3. Find: `postgresql-x64-16` (or your version)
4. Right-click → Start
5. Try again

---

## 📊 Database Schema Overview

```
organizations (root)
    ├── departments
    │   └── users
    ├── users (organization users)
    ├── budgets
    │   ├── budget_allocations
    │   └── transactions
    └── activity_logs

Standalone:
    ├── budget_categories (predefined)
    ├── notifications (per user)
    ├── messages (between users)
    ├── password_resets
    └── email_verifications
```

---

## 🎯 Next Steps After Database Creation

### **1. Update .env file**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=budmap
DB_USER=postgres
DB_PASSWORD=your_actual_password_here
```

### **2. Run Migration (Add Sample Data)**
```bash
cd C:\fyp\Backend
npm install
npm run migrate
```

This will add:
- 2 sample organizations
- 4 departments
- 4 test users
- 12 budget categories
- 4 budgets
- 6 transactions
- Sample data for testing

### **3. Start Your Application**
```bash
# Terminal 1 - Backend
cd C:\fyp\Backend
npm start

# Terminal 2 - Frontend
cd C:\fyp\Frontain
npm start
```

### **4. Test Login**
Visit: `http://localhost:3000`

Login with:
- **Email:** `admin@budmap.com`
- **Password:** `admin123`

---

## 💾 Backup & Restore

### **Create Backup**
```bash
pg_dump -U postgres budmap > budmap_backup.sql
```

### **Restore Backup**
```bash
psql -U postgres budmap < budmap_backup.sql
```

---

## 🎊 Summary

**What you need to do:**

1. ✅ Run `create-budmap-database.bat`
2. ✅ Enter your PostgreSQL password
3. ✅ Update `.env` file with password
4. ✅ Run `npm run migrate`
5. ✅ Start the app!

**That's it! Your database is ready!** 🚀

---

**Created:** March 18, 2026
**Database:** PostgreSQL
**Project:** BudMap
**Status:** Ready to use! ✨
