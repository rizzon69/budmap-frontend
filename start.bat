@echo off
REM BudMap Quick Start Script
REM Handles Frontain→Frontend rename, .env creation, and launch

echo.
echo ========================================
echo    BudMap - Quick Start Script
echo ========================================
echo.

REM Check correct directory
if not exist "Backend" (
    echo ERROR: Backend folder not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

echo [Step 1/4] Checking folder structure...

REM Try to rename Frontain to Frontend if needed
if exist "Frontain" (
    if not exist "Frontend" (
        echo Found "Frontain" - attempting to rename to "Frontend"...
        rename Frontain Frontend
        if errorlevel 1 (
            echo WARNING: Could not rename folder ^(may be in use by another process^).
            echo Continuing with "Frontain" as the frontend folder.
            set FRONTEND_DIR=Frontain
        ) else (
            echo SUCCESS: Renamed to "Frontend".
            set FRONTEND_DIR=Frontend
        )
    ) else (
        echo Both "Frontain" and "Frontend" exist - using "Frontend".
        set FRONTEND_DIR=Frontend
    )
) else if exist "Frontend" (
    echo "Frontend" folder found.
    set FRONTEND_DIR=Frontend
) else (
    echo ERROR: Neither "Frontain" nor "Frontend" folder found!
    pause
    exit /b 1
)

echo.
echo [Step 2/4] Ensuring .env file exists in %FRONTEND_DIR%...
if not exist "%FRONTEND_DIR%\.env" (
    echo REACT_APP_API_URL=http://localhost:5000/api > "%FRONTEND_DIR%\.env"
    echo SUCCESS: .env created in %FRONTEND_DIR%
) else (
    echo .env already exists - skipping.
)

echo.
echo [Step 3/4] Installing dependencies...
echo This may take a few minutes...
echo.
call npm install
cd Backend && call npm install && cd ..
cd %FRONTEND_DIR% && call npm install && cd ..

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo Default login credentials:
echo   Admin:   admin@budmap.com / admin123
echo   Finance: finance@budmap.com / finance123
echo.
echo [Step 4/4] Starting the application...
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press Ctrl+C to stop the servers.
echo ========================================
echo.

REM Start both servers
start "BudMap Backend" cmd /k "cd Backend && npm start"
timeout /t 3 /nobreak >nul
start "BudMap Frontend" cmd /k "cd %FRONTEND_DIR% && npm start"
