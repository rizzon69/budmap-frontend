@echo off
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║   🌟 BudMap Enhanced Features Installation 🌟               ║
echo ║   Version 2.0.0                                              ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Installing enhanced features...
echo.

REM Check if node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

REM Install backend dependencies
echo 📦 Installing backend dependencies...
echo.
cd Backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend installation failed!
    pause
    exit /b 1
)

echo.
echo ✅ Backend dependencies installed successfully!
echo.
echo New packages installed:
echo   ✅ nodemailer     - Email functionality
echo   ✅ multer         - File uploads
echo   ✅ pdfkit         - PDF generation
echo   ✅ exceljs        - Excel exports
echo   ✅ helmet         - Security headers
echo   ✅ winston        - Logging
echo   ✅ rate-limiter   - Rate limiting
echo.

REM Go back to root
cd ..

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║   ✨ Installation Complete! ✨                               ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🎉 New Features Available:
echo.
echo   ✅ User Registration System
echo   ✅ Email Verification
echo   ✅ Password Reset
echo   ✅ Internal Messaging
echo   ✅ Advanced Analytics
echo   ✅ Budget Forecasting
echo   ✅ Spending Pattern Analysis
echo   ✅ Enhanced Security
echo.
echo 📚 Documentation:
echo   - ENHANCED_FEATURES_DOCUMENTATION.md (Complete API docs)
echo   - QUICK_START_ENHANCED.md (Quick start guide)
echo   - FEATURES_SUMMARY.md (Feature overview)
echo.
echo 🚀 To start the server:
echo   Option 1: Double-click start.bat
echo   Option 2: Run "npm start" from this folder
echo.
echo 🧪 Test the features:
echo   1. Start the server
echo   2. Server will show version 2.0.0
echo   3. Test with Postman or any API client
echo   4. Check QUICK_START_ENHANCED.md for examples
echo.
echo 💡 Quick Test:
echo   POST http://localhost:5000/api/registration/organization
echo   Use the example from QUICK_START_ENHANCED.md
echo.
echo Press any key to start the server now...
pause >nul

echo.
echo Starting BudMap Enhanced Edition...
echo.

REM Start the server
call npm start

pause
