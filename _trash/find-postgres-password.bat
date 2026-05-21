@echo off
echo ========================================
echo PostgreSQL Password Finder
echo ========================================
echo.
echo This will help you find your PostgreSQL password.
echo.
echo Common passwords to try:
echo 1. postgres
echo 2. admin
echo 3. password
echo 4. root
echo 5. (blank/empty)
echo.
echo Let's test them automatically...
echo.
pause

echo.
echo Testing common passwords...
echo.

echo [1/5] Testing: postgres
psql -U postgres -c "SELECT version();" 2>nul
if errorlevel 0 (
    echo ✅ SUCCESS! Your password is: postgres
    echo.
    echo Update your .env file:
    echo DB_PASSWORD=postgres
    echo.
    goto :done
)

echo ❌ Not 'postgres'
echo.

echo [2/5] Testing: admin
set PGPASSWORD=admin
psql -U postgres -c "SELECT version();" 2>nul
if errorlevel 0 (
    echo ✅ SUCCESS! Your password is: admin
    echo.
    echo Update your .env file:
    echo DB_PASSWORD=admin
    echo.
    goto :done
)

echo ❌ Not 'admin'
echo.

echo [3/5] Testing: password  
set PGPASSWORD=password
psql -U postgres -c "SELECT version();" 2>nul
if errorlevel 0 (
    echo ✅ SUCCESS! Your password is: password
    echo.
    echo Update your .env file:
    echo DB_PASSWORD=password
    echo.
    goto :done
)

echo ❌ Not 'password'
echo.

echo [4/5] Testing: root
set PGPASSWORD=root
psql -U postgres -c "SELECT version();" 2>nul
if errorlevel 0 (
    echo ✅ SUCCESS! Your password is: root
    echo.
    echo Update your .env file:
    echo DB_PASSWORD=root
    echo.
    goto :done
)

echo ❌ Not 'root'
echo.

echo [5/5] Testing: blank password
set PGPASSWORD=
psql -U postgres -c "SELECT version();" 2>nul
if errorlevel 0 (
    echo ✅ SUCCESS! Your password is blank/empty
    echo.
    echo Update your .env file:
    echo DB_PASSWORD=
    echo.
    goto :done
)

echo ❌ Not blank
echo.
echo.
echo ========================================
echo None of the common passwords worked!
echo ========================================
echo.
echo You'll need to manually enter your password.
echo.
echo Options:
echo 1. Try to remember your password
echo 2. Reset your PostgreSQL password (see RESET_POSTGRES_PASSWORD.md)
echo 3. Reinstall PostgreSQL
echo.

:done
pause
