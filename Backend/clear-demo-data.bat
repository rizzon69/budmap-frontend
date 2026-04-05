@echo off
echo.
echo =========================================
echo   BudMap - Clear All Demo/Seed Data
echo =========================================
echo.
echo This will DELETE all transactions, budgets,
echo departments, and users from the database.
echo.
echo Only the 4 default login accounts and
echo budget categories will be kept.
echo.
set /p confirm=Type YES to confirm and continue: 
if /i "%confirm%" NEQ "YES" (
    echo Cancelled. No data was changed.
    pause
    exit /b 0
)
echo.
echo Clearing data...
cd /d "%~dp0"
node clear-data.js
pause
