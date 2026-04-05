@echo off
echo.
echo  ================================================
echo   BudMap - Seed Database + Restart Server
echo  ================================================
echo.

cd /d "%~dp0Backend"

echo  [1/3] Stopping server on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

echo  [2/3] Seeding database with sample data...
node seed.js
if %ERRORLEVEL% NEQ 0 (
    echo  ERROR: Seed failed. Check MongoDB connection.
    pause
    exit /b 1
)

echo.
echo  [3/3] Starting server...
echo.
npm run dev
