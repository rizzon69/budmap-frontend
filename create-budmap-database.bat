@echo off
echo ========================================
echo BudMap Database Creator
echo ========================================
echo.
echo This will create the budmap database with all tables.
echo.
echo IMPORTANT: You need to know your PostgreSQL password!
echo.
pause

echo.
echo Creating database...
echo.

cd Backend\database

psql -U postgres -f create-database.sql

if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Database creation failed!
    echo ========================================
    echo.
    echo Common issues:
    echo 1. Wrong PostgreSQL password
    echo 2. PostgreSQL service not running
    echo 3. User 'postgres' doesn't exist
    echo.
    echo Solutions:
    echo - Check your PostgreSQL password
    echo - Make sure PostgreSQL is running (check Services)
    echo - Try running as Administrator
    echo.
) else (
    echo.
    echo ========================================
    echo SUCCESS! Database created!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Update Backend\.env with your PostgreSQL password
    echo 2. Run: cd Backend
    echo 3. Run: npm run migrate
    echo.
)

pause
