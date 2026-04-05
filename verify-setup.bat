@echo off
REM Setup Verification Script for BudMap

echo.
echo ========================================
echo    BudMap - Setup Verification
echo ========================================
echo.

set ERROR_COUNT=0

REM Check if Backend folder exists
echo [CHECK 1/6] Backend folder...
if exist "Backend" (
    echo [OK] Backend folder found
) else (
    echo [ERROR] Backend folder not found!
    set /a ERROR_COUNT+=1
)

REM Check if Frontend folder exists
echo.
echo [CHECK 2/6] Frontend folder...
if exist "Frontend" (
    echo [OK] Frontend folder found
) else if exist "Frontain" (
    echo [WARNING] Found "Frontain" folder - should be "Frontend"
    echo          Please rename: Frontain -^> Frontend
    set /a ERROR_COUNT+=1
) else (
    echo [ERROR] Frontend folder not found!
    set /a ERROR_COUNT+=1
)

REM Check Backend .env
echo.
echo [CHECK 3/6] Backend .env file...
if exist "Backend\.env" (
    echo [OK] Backend .env file found
    echo      Content:
    type "Backend\.env" | findstr /R "."
) else (
    echo [ERROR] Backend .env file not found!
    set /a ERROR_COUNT+=1
)

REM Check Frontend .env
echo.
echo [CHECK 4/6] Frontend .env file...
if exist "Frontend\.env" (
    echo [OK] Frontend .env file found
    echo      Content:
    type "Frontend\.env" | findstr /R "."
) else if exist "Frontain\.env" (
    echo [OK] Frontain .env file found (will work after folder rename)
    echo      Content:
    type "Frontain\.env" | findstr /R "."
) else (
    echo [WARNING] Frontend .env file not found
    echo           Will be created during setup
)

REM Check Backend node_modules
echo.
echo [CHECK 5/6] Backend dependencies...
if exist "Backend\node_modules" (
    echo [OK] Backend dependencies installed
) else (
    echo [WARNING] Backend dependencies not installed
    echo           Run: cd Backend ^&^& npm install
)

REM Check Frontend node_modules
echo.
echo [CHECK 6/6] Frontend dependencies...
if exist "Frontend\node_modules" (
    echo [OK] Frontend dependencies installed
) else if exist "Frontain\node_modules" (
    echo [OK] Frontend dependencies installed (in Frontain folder)
) else (
    echo [WARNING] Frontend dependencies not installed
    echo           Run: cd Frontend ^&^& npm install
)

REM Summary
echo.
echo ========================================
echo            SUMMARY
echo ========================================

if %ERROR_COUNT% EQU 0 (
    echo.
    echo [SUCCESS] All critical checks passed!
    echo.
    echo You can now start the application:
    echo   1. Double-click start.bat, OR
    echo   2. Run: npm start
    echo.
) else (
    echo.
    echo [ATTENTION] Found %ERROR_COUNT% issue(s) that need attention
    echo.
    echo To fix all issues automatically:
    echo   1. Double-click start.bat, OR
    echo   2. Follow instructions in ERROR_FIXES.md
    echo.
)

echo Default Login Credentials:
echo   Admin:   admin@budmap.com / admin123
echo   Finance: finance@budmap.com / finance123
echo.
echo ========================================

pause
