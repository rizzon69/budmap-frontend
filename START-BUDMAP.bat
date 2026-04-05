@echo off
title BudMap - Full Stack Launcher
color 0A

echo.
echo  =====================================================
echo   BudMap Full Stack Launcher
echo   Backend + Seed + Frontend
echo  =====================================================
echo.

:: ── Step 1: Kill anything on ports 3000 and 5000 ────────────────────────────
echo  [1/4] Clearing ports 3000 and 5000...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000 " 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo  Done.
echo.

:: ── Step 2: Install backend deps if needed ───────────────────────────────────
echo  [2/4] Checking backend dependencies...
cd /d "%~dp0Backend"
if not exist "node_modules\mongoose" (
    echo  Installing backend packages...
    call npm install
)
echo  Done.
echo.

:: ── Step 3: Seed the database ────────────────────────────────────────────────
echo  [3/4] Seeding MongoDB database...
node seed.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  WARNING: Seed failed. Check your MongoDB connection in .env
    echo  MONGODB_URI must point to a running MongoDB instance.
    echo.
    pause
)
echo.

:: ── Step 4: Start backend in new window ──────────────────────────────────────
echo  [4/4] Starting servers...
echo.
start "BudMap Backend :5000" cmd /k "cd /d %~dp0Backend && npm run dev"
timeout /t 3 /nobreak >nul

:: ── Step 5: Install frontend deps if needed and start ────────────────────────
cd /d "%~dp0Frontain"
if not exist "node_modules\react" (
    echo  Installing frontend packages...
    call npm install
)
start "BudMap Frontend :3000" cmd /k "cd /d %~dp0Frontain && npm start"

echo.
echo  =====================================================
echo   Both servers starting in separate windows:
echo.
echo   Backend  : http://localhost:5000
echo   Frontend : http://localhost:3000
echo.
echo   Login credentials:
echo   admin@budmap.com       / admin123
echo   finance@budmap.com     / finance123
echo   department@budmap.com  / dept123
echo   viewer@budmap.com      / viewer123
echo  =====================================================
echo.
echo  You can close this window. The servers run separately.
pause
