# BudMap - Error Fixes & Setup Guide

## Issues Identified and Fixed

### 1. **CRITICAL: Folder Name Typo**
- **Issue**: Frontend folder is named "Frontain" instead of "Frontend"
- **Fix**: Rename the folder from "Frontain" to "Frontend"
- **Command**: 
  ```bash
  cd "C:\budget management"
  rename Frontain Frontend
  ```

### 2. **Missing Frontend .env File**
- **Issue**: No environment configuration for React app
- **Fix**: Create `.env` file in Frontend directory
- **Path**: `C:\budget management\Frontend\.env`
- **Content**:
  ```
  REACT_APP_API_URL=http://localhost:5000/api
  ```

### 3. **Update Root package.json**
- **Issue**: Root package.json references "Frontain" folder
- **Fix**: Update the folder path to "Frontend"
- **File**: `C:\budget management\package.json`
- **Changes**:
  ```json
  {
    "scripts": {
      "start": "concurrently \"npm run server\" \"npm run client\"",
      "server": "cd Backend && npm start",
      "client": "cd Frontend && npm start",
      "install-all": "npm install && cd Backend && npm install && cd ../Frontend && npm install"
    }
  }
  ```

### 4. **Install Dependencies**
After fixing the above issues, install all dependencies:

```bash
# Navigate to project root
cd "C:\budget management"

# Install root dependencies
npm install

# Install Backend dependencies
cd Backend
npm install

# Install Frontend dependencies
cd ../Frontend
npm install
```

## Step-by-Step Fix Instructions

### Option A: Manual Fix (Recommended)

1. **Rename Frontend Folder**:
   - Go to `C:\budget management`
   - Right-click on `Frontain` folder
   - Select "Rename"
   - Change to `Frontend`

2. **Create Frontend .env File**:
   - Navigate to `C:\budget management\Frontend`
   - Create a new file named `.env`
   - Add the following content:
     ```
     REACT_APP_API_URL=http://localhost:5000/api
     ```

3. **Update Root package.json**:
   - Open `C:\budget management\package.json`
   - Replace all instances of "Frontain" with "Frontend"
   - Save the file

4. **Install Dependencies**:
   Open Command Prompt or PowerShell and run:
   ```bash
   cd "C:\budget management"
   npm run install-all
   ```

### Option B: Quick Command Line Fix

Open Command Prompt or PowerShell as Administrator and run:

```bash
# Navigate to project directory
cd "C:\budget management"

# Rename folder
rename Frontain Frontend

# Create Frontend .env file (Windows)
echo REACT_APP_API_URL=http://localhost:5000/api > Frontend\.env

# Install all dependencies
npm run install-all
```

## Running the Application

After fixing all errors:

### Start Both Backend and Frontend (Recommended):
```bash
cd "C:\budget management"
npm start
```

### Or Start Separately:

**Backend Only**:
```bash
cd "C:\budget management\Backend"
npm start
```
Server will run on: http://localhost:5000

**Frontend Only**:
```bash
cd "C:\budget management\Frontend"
npm start
```
App will open on: http://localhost:3000

## Default Login Credentials

After starting the application, you can log in with these test accounts:

### Admin Account:
- **Email**: admin@budmap.com
- **Password**: admin123
- **Access**: Full system access

### Finance Officer:
- **Email**: finance@budmap.com
- **Password**: finance123
- **Access**: Financial management

### Department Head:
- **Email**: department@budmap.com
- **Password**: dept123
- **Access**: Department budget management

### Viewer:
- **Email**: viewer@budmap.com
- **Password**: viewer123
- **Access**: Read-only access

## Verifying the Fix

1. **Check Backend**:
   - Open: http://localhost:5000
   - You should see: Welcome to BudMap API message

2. **Check Backend Health**:
   - Open: http://localhost:5000/api/health
   - You should see: `{"status":"OK","timestamp":"..."}`

3. **Check Frontend**:
   - Open: http://localhost:3000
   - You should see the BudMap landing page

## Common Issues & Solutions

### Issue: "Cannot find module 'express'"
**Solution**: Dependencies not installed
```bash
cd Backend
npm install
```

### Issue: "Cannot find module 'react'"
**Solution**: Frontend dependencies not installed
```bash
cd Frontend
npm install
```

### Issue: "Port 5000 already in use"
**Solution**: Change port in Backend/.env
```
PORT=5001
```
Then update Frontend/.env:
```
REACT_APP_API_URL=http://localhost:5001/api
```

### Issue: "ENOENT: no such file or directory"
**Solution**: Make sure you renamed "Frontain" to "Frontend"

### Issue: CORS errors
**Solution**: Backend already has CORS enabled. Make sure both servers are running.

## Project Structure (After Fix)

```
budget management/
├── Backend/
│   ├── data/
│   │   └── store.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── budgets.js
│   │   ├── departments.js
│   │   ├── notifications.js
│   │   ├── organizations.js
│   │   ├── reports.js
│   │   ├── transactions.js
│   │   └── users.js
│   ├── .env
│   ├── package.json
│   └── server.js
├── Frontend/  ← (renamed from Frontain)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   ├── .env  ← (needs to be created)
│   └── package.json
└── package.json
```

## Additional Notes

- **Database**: Currently using in-memory storage (store.js). In production, migrate to PostgreSQL.
- **Authentication**: JWT-based authentication with 7-day expiry.
- **File Storage**: All data is in memory and will reset on server restart.
- **Testing**: Test accounts are pre-loaded in Backend/data/store.js

## Need Help?

If you encounter any issues:
1. Check that both Backend and Frontend are running
2. Check browser console for errors (F12)
3. Check Backend terminal for errors
4. Ensure all dependencies are installed
5. Verify .env files are created correctly

## Next Steps After Fixing

1. ✅ Test login with provided credentials
2. ✅ Explore different user roles
3. ✅ Create budgets and transactions
4. ✅ Generate reports
5. ✅ Test admin features
6. 📝 Consider implementing database persistence
7. 📝 Add more features as needed

---

**Project**: BudMap - Budget Allocation Application
**Author**: Reazon Koirala
**Purpose**: Budget management for SMEs, NGOs, and Educational Institutions in Nepal
