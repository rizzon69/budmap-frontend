@echo off
echo ====================================
echo BudMap PostgreSQL Setup Script
echo ====================================
echo.

cd Backend

echo Step 1: Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo Step 2: Testing database connection...
call npm run db:test
if errorlevel 1 (
    echo.
    echo ERROR: Database connection failed!
    echo Please check:
    echo 1. PostgreSQL is installed and running
    echo 2. Database 'budmap' is created
    echo 3. Credentials in .env file are correct
    echo.
    echo To create database, run in psql:
    echo   CREATE DATABASE budmap;
    echo.
    pause
    exit /b 1
)
echo.

echo Step 3: Running database migration...
call npm run migrate
if errorlevel 1 (
    echo ERROR: Migration failed!
    pause
    exit /b 1
)
echo.

echo ====================================
echo Setup completed successfully!
echo ====================================
echo.
echo You can now start the server with:
echo   cd Backend
echo   npm start
echo.
pause
