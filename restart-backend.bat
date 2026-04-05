@echo off
echo.
echo  ================================
echo   BudMap Backend Restart
echo  ================================
echo.

:: Kill any process using port 5000
echo  Stopping existing server on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000"') do (
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul

:: Navigate to backend and start
cd /d "%~dp0Backend"
echo  Starting BudMap backend...
echo.
npm run dev
