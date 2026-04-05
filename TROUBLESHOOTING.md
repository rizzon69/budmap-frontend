# 🔍 Troubleshooting Guide - BudMap

## Quick Diagnostics

### Run This First
Double-click `verify-setup.bat` to automatically check your setup status.

---

## Common Errors & Solutions

### 1. 🔴 "Cannot find module 'express'" (Backend)

**Error Message:**
```
Error: Cannot find module 'express'
```

**Cause:** Backend dependencies not installed

**Solution:**
```bash
cd "C:\budget management\Backend"
npm install
```

**Quick Fix:** Run `start.bat` - it installs everything automatically

---

### 2. 🔴 "Cannot find module 'react'" (Frontend)

**Error Message:**
```
Error: Cannot find module 'react'
```

**Cause:** Frontend dependencies not installed

**Solution:**
```bash
cd "C:\budget management\Frontend"
npm install
```

**Quick Fix:** Run `start.bat` - it installs everything automatically

---

### 3. 🔴 Port 5000 Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Cause:** Another application is using port 5000

**Solution A - Kill the Process:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill it (replace PID with actual number)
taskkill /PID [PID] /F
```

**Solution B - Change Port:**
Edit `Backend\.env`:
```
PORT=5001
```
Then edit `Frontend\.env`:
```
REACT_APP_API_URL=http://localhost:5001/api
```

---

### 4. 🔴 Port 3000 Already in Use

**Error Message:**
```
Something is already running on port 3000
```

**Cause:** Another React app is running

**Solution A - Kill Process:**
```bash
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

**Solution B - Use Different Port:**
When prompted, press `Y` to run on different port

---

### 5. 🔴 "ENOENT: no such file or directory"

**Error Message:**
```
Error: ENOENT: no such file or directory, open 'C:\budget management\Frontain\...'
```

**Cause:** Folder still named "Frontain" instead of "Frontend"

**Solution:**
```bash
cd "C:\budget management"
rename Frontain Frontend
```

**OR** just run `start.bat` - it renames automatically

---

### 6. 🔴 CORS Error

**Error Message (in browser console):**
```
Access to XMLHttpRequest at 'http://localhost:5000/api/auth/login' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Cause:** Backend not running or CORS not configured

**Solution:**
1. Make sure Backend is running on port 5000
2. Check Backend terminal for errors
3. Verify Backend has CORS enabled (it does by default)
4. Restart both servers:
   ```bash
   # Stop both (Ctrl+C)
   # Restart
   npm start
   ```

---

### 7. 🔴 White Screen After Login

**Symptoms:**
- Login appears successful
- Page goes white
- No error message shown

**Diagnosis:** Check browser console (F12)

**Common Causes & Solutions:**

**A. Missing dependencies:**
```bash
cd Frontend
npm install
```

**B. Component error:**
Check browser console for specific component error

**C. API connection issue:**
1. Check Backend is running
2. Check `Frontend\.env` has correct API URL
3. Test: http://localhost:5000/api/health

---

### 8. 🔴 "Invalid token" or "Access denied"

**Error Message:**
```json
{"success": false, "message": "Invalid or expired token"}
```

**Cause:** Token expired or invalid

**Solution:**
1. Clear browser localStorage:
   - Open browser console (F12)
   - Go to Application/Storage tab
   - Clear localStorage
   - Refresh page

2. Log in again

**Quick Fix:**
```javascript
// In browser console (F12)
localStorage.clear()
location.reload()
```

---

### 9. 🔴 "JWT_SECRET is not defined"

**Error Message:**
```
Error: JWT_SECRET is not defined
```

**Cause:** Backend .env file missing or not loaded

**Solution:**
Check `Backend\.env` exists with:
```
PORT=5000
JWT_SECRET=budmap_secret_key_2024_nepal_fyp
JWT_EXPIRES_IN=7d
```

---

### 10. 🔴 "Cannot GET /" (404 Error)

**Error:** 404 when accessing http://localhost:3000

**Cause:** Frontend not running

**Solution:**
```bash
cd "C:\budget management\Frontend"
npm start
```

---

### 11. 🔴 Network Error / Request Failed

**Error in UI:**
```
Network Error
Request failed with status code 500
```

**Solutions:**

**A. Backend not running:**
```bash
cd Backend
npm start
```

**B. Wrong API URL:**
Check `Frontend\.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

**C. Backend crashed:**
Check Backend terminal for errors

---

### 12. 🔴 npm ERR! Missing script: "start"

**Error Message:**
```
npm ERR! missing script: start
```

**Cause:** Wrong directory or package.json issue

**Solution:**
Make sure you're in correct directory:
```bash
# For running both:
cd "C:\budget management"
npm start

# For Backend only:
cd "C:\budget management\Backend"
npm start

# For Frontend only:
cd "C:\budget management\Frontend"
npm start
```

---

### 13. 🔴 "concurrently not found"

**Error Message:**
```
'concurrently' is not recognized as an internal or external command
```

**Cause:** Root dependencies not installed

**Solution:**
```bash
cd "C:\budget management"
npm install
```

---

### 14. 🔴 Login Fails with Correct Credentials

**Symptoms:**
- Using correct credentials
- Login button doesn't work or shows error

**Solutions:**

**A. Check Backend is running:**
- Visit: http://localhost:5000
- Should see: Welcome message

**B. Check API endpoint:**
- Visit: http://localhost:5000/api/health
- Should see: `{"status":"OK",...}`

**C. Check console errors:**
- Press F12 in browser
- Look for red errors
- Usually network or CORS issue

**D. Verify credentials:**
```
Email: admin@budmap.com
Password: admin123
```
(Case sensitive!)

---

### 15. 🔴 Charts Not Displaying

**Symptoms:**
- Dashboard loads but charts missing
- Empty spaces where charts should be

**Cause:** Recharts not installed

**Solution:**
```bash
cd Frontend
npm install recharts
```

---

### 16. 🔴 Icons Not Showing

**Symptoms:**
- Icons appear as boxes or missing
- UI looks broken

**Cause:** lucide-react not installed

**Solution:**
```bash
cd Frontend
npm install lucide-react
```

---

### 17. 🔴 "Proxy error" or "ECONNREFUSED"

**Error Message:**
```
[HPM] Error occurred while trying to proxy request
```

**Cause:** Backend not running when Frontend tries to connect

**Solution:**
1. Start Backend first:
   ```bash
   cd Backend
   npm start
   ```
2. Wait for "Server running on..." message
3. Then start Frontend:
   ```bash
   cd Frontend
   npm start
   ```

---

### 18. 🔴 Styles Not Loading / Ugly UI

**Symptoms:**
- No colors
- No spacing
- Plain HTML look

**Cause:** CSS files not imported

**Solution:**
Restart Frontend:
```bash
cd Frontend
npm start
```

---

## 🔧 General Debugging Steps

### Step 1: Check Basics
- [ ] Node.js installed: `node --version`
- [ ] npm installed: `npm --version`
- [ ] In correct directory: `cd "C:\budget management"`

### Step 2: Verify Setup
- [ ] Run `verify-setup.bat`
- [ ] Check folder name is "Frontend" not "Frontain"
- [ ] Verify .env files exist

### Step 3: Check Dependencies
```bash
# Check if node_modules exist
dir Backend\node_modules
dir Frontend\node_modules

# If missing, install:
npm run install-all
```

### Step 4: Check Servers
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] No errors in terminal

### Step 5: Browser Check
- [ ] Open http://localhost:3000
- [ ] Press F12 (developer tools)
- [ ] Check Console tab for errors
- [ ] Check Network tab for failed requests

---

## 🎯 Nuclear Option (Start Fresh)

If nothing works, start completely fresh:

### 1. Stop Everything
- Close all terminals
- Close browser

### 2. Clean Install
```bash
cd "C:\budget management"

# Delete node_modules (all three)
rmdir /s /q node_modules
rmdir /s /q Backend\node_modules
rmdir /s /q Frontend\node_modules

# Rename folder if needed
rename Frontain Frontend

# Fresh install
npm run install-all
```

### 3. Start Fresh
```bash
npm start
```

---

## 📱 Browser-Specific Issues

### Chrome/Edge
- Clear cache: Ctrl+Shift+Delete
- Hard refresh: Ctrl+Shift+R
- Disable extensions: Incognito mode

### Firefox
- Clear cache: Ctrl+Shift+Delete
- Hard refresh: Ctrl+F5
- Disable extensions: Private window

---

## 🆘 Still Stuck?

### Check These Files
1. `ERROR_FIXES.md` - Detailed fixes
2. `README.md` - Full documentation
3. `WHAT_I_FIXED.md` - What was changed

### Diagnostic Commands
```bash
# Check Node/npm
node --version
npm --version

# Check ports in use
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# Check folder structure
dir "C:\budget management"
```

### Common Checklist
- [ ] Folder name correct (Frontend not Frontain)
- [ ] .env files exist in Backend and Frontend
- [ ] Dependencies installed (node_modules folders exist)
- [ ] Backend server running without errors
- [ ] Frontend app running without errors
- [ ] No firewall blocking ports 3000/5000
- [ ] Correct Node.js version (14+ recommended)

---

## 💡 Prevention Tips

### Before Running
1. Always run `verify-setup.bat` first
2. Make sure folder is named "Frontend"
3. Check .env files exist
4. Install dependencies if missing

### When Developing
1. Don't close terminals abruptly
2. Save files before testing
3. Check console for errors
4. Keep Backend running when using Frontend

### When Updating
1. Stop servers before updating code
2. Run `npm install` after adding packages
3. Restart servers after changes

---

## 📞 Emergency Commands

```bash
# Kill all Node processes (Windows)
taskkill /f /im node.exe

# Find what's using a port
netstat -ano | findstr :[PORT]

# Kill specific process
taskkill /PID [PID] /F

# Fresh start
cd "C:\budget management"
npm run install-all
npm start
```

---

**Remember:** Most issues are solved by:
1. Running `start.bat`
2. Ensuring folder is named "Frontend"
3. Installing dependencies: `npm run install-all`
4. Starting correctly: `npm start`

**Still having issues?** Double-check `verify-setup.bat` output! 🔍
