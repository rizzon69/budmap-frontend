# ✅ Database Setup Checklist

## Current Status: ❌ NOT YET CREATED

Based on the error you showed, the database hasn't been created yet because of password authentication issues.

---

## 🎯 Quick Setup (Follow These Steps)

### **Step 1: Find Your PostgreSQL Password**

**Option A - Automated Test (Recommended):**
```bash
# Double-click this file:
quick-find-password.bat
```

**Option B - Manual Test:**
```bash
# Try connecting to PostgreSQL
psql -U postgres

# If it asks for password, try these common ones:
- postgres
- admin
- password
- root
- (the one you set during installation)
```

---

### **Step 2: Update .env File**

Once you know your password, edit:
```
C:\fyp\Backend\.env
```

Change this line:
```env
DB_PASSWORD=your_actual_password_here
```

For example, if your password is "admin":
```env
DB_PASSWORD=admin
```

---

### **Step 3: Create the Database**

**Option A - Automated:**
```bash
# Double-click:
create-budmap-database.bat
```

**Option B - Manual:**
```bash
# Open Command Prompt
cd C:\fyp\Backend\database
psql -U postgres -f create-database.sql
```

---

### **Step 4: Run Migration (Add Sample Data)**

```bash
cd C:\fyp\Backend
npm install
npm run migrate
```

This adds:
- ✅ 2 Organizations
- ✅ 4 Departments  
- ✅ 4 Test Users
- ✅ 12 Budget Categories
- ✅ 4 Budgets
- ✅ 6 Transactions

---

### **Step 5: Verify Everything Works**

```bash
# Test database connection
cd Backend
npm run db:test
```

You should see:
```
✅ Connected to PostgreSQL database
📋 Existing Tables:
   ✓ organizations
   ✓ departments
   ✓ users
   ... (12 tables total)
```

---

## 🔍 How to Check If Database Exists

### **Method 1: Using psql**
```bash
psql -U postgres -l | findstr budmap
```

If you see "budmap" in the output, database exists! ✅

### **Method 2: Using pgAdmin**
1. Open pgAdmin 4
2. Expand "Servers" → "PostgreSQL"
3. Look for "budmap" in the databases list

### **Method 3: Using Node.js**
```bash
cd Backend
node database/test-connection.js
```

---

## 📊 What You Should Have

### **Files Created (by me):**
- ✅ `create-database.sql` - Database creation script
- ✅ `create-budmap-database.bat` - Automated setup
- ✅ `find-password.js` - Password finder script
- ✅ `quick-find-password.bat` - Quick password test
- ✅ All documentation files

### **What You Need to Do:**
1. ⏳ Find your PostgreSQL password
2. ⏳ Update .env file
3. ⏳ Create the database
4. ⏳ Run migration

---

## ❌ Common Issues & Solutions

### **Issue 1: "password authentication failed"**
**Cause:** Wrong password in .env file
**Solution:** Run `quick-find-password.bat` to find correct password

### **Issue 2: "psql: command not found"**
**Cause:** PostgreSQL not in PATH
**Solution:** Use full path:
```bash
"C:\Program Files\PostgreSQL\16\bin\psql" -U postgres
```

### **Issue 3: "PostgreSQL service not running"**
**Cause:** PostgreSQL stopped
**Solution:**
1. Win + R → `services.msc`
2. Find "postgresql-x64-16"
3. Right-click → Start

### **Issue 4: "Database already exists"**
**Cause:** Database created previously
**Solution:** Just run migration:
```bash
cd Backend
npm run migrate
```

---

## 🎊 When Everything is Working

You'll be able to:
- ✅ Connect to database without errors
- ✅ See 12 tables in database
- ✅ Login to app with test accounts
- ✅ See sample data in dashboard

**Test Accounts:**
- Admin: `admin@budmap.com` / `admin123`
- Finance: `finance@budmap.com` / `finance123`
- Dept Head: `department@budmap.com` / `dept123`

---

## 🚀 Quick Commands Summary

```bash
# Find password
quick-find-password.bat

# Create database  
create-budmap-database.bat

# Run migration
cd Backend
npm run migrate

# Test connection
npm run db:test

# Start app
npm start
```

---

## 💡 Need More Help?

Check these files:
- `DATABASE_CREATION_GUIDE.md` - Complete setup guide
- `RESET_POSTGRES_PASSWORD.md` - How to reset password
- `DATABASE_SETUP_README.md` - Overview

---

**Start with `quick-find-password.bat` right now!** 🚀
