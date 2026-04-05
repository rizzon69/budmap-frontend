@echo off
echo ========================================
echo PostgreSQL Password Fix Helper
echo ========================================
echo.

cd Backend

echo Testing connection with different common passwords...
echo.

echo If this works, it will:
echo 1. Test your password
echo 2. Create budmap database
echo 3. Update your .env file
echo.

node test-postgres-connection.js

pause
