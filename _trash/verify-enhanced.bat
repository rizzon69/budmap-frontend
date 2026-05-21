@echo off
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║   🔍 BudMap Enhanced Edition - Installation Verification    ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo Checking installation status...
echo.

REM Check if node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is NOT installed
    echo    Please install from: https://nodejs.org
    goto :end
) else (
    echo ✅ Node.js is installed
    node --version
)

echo.

REM Check backend folder
if not exist "Backend" (
    echo ❌ Backend folder not found
    goto :end
) else (
    echo ✅ Backend folder exists
)

REM Check backend node_modules
if not exist "Backend\node_modules" (
    echo ⚠️  Backend dependencies not installed
    echo    Run: cd Backend && npm install
) else (
    echo ✅ Backend dependencies installed
)

REM Check new route files
if not exist "Backend\routes\registration.js" (
    echo ❌ registration.js not found
) else (
    echo ✅ registration.js exists
)

if not exist "Backend\routes\messages.js" (
    echo ❌ messages.js not found
) else (
    echo ✅ messages.js exists
)

if not exist "Backend\routes\analytics.js" (
    echo ❌ analytics.js not found
) else (
    echo ✅ analytics.js exists
)

echo.

REM Check documentation
if not exist "ENHANCED_FEATURES_DOCUMENTATION.md" (
    echo ⚠️  Enhanced documentation not found
) else (
    echo ✅ Enhanced documentation exists
)

if not exist "QUICK_START_ENHANCED.md" (
    echo ⚠️  Quick start guide not found
) else (
    echo ✅ Quick start guide exists
)

if not exist "FEATURES_SUMMARY.md" (
    echo ⚠️  Features summary not found
) else (
    echo ✅ Features summary exists
)

if not exist "README_ENHANCED.md" (
    echo ⚠️  Enhanced README not found
) else (
    echo ✅ Enhanced README exists
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo.

REM Check package.json for new dependencies
findstr /C:"nodemailer" Backend\package.json >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ nodemailer dependency found
) else (
    echo ⚠️  nodemailer not in package.json
)

findstr /C:"multer" Backend\package.json >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ multer dependency found
) else (
    echo ⚠️  multer not in package.json
)

findstr /C:"pdfkit" Backend\package.json >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ pdfkit dependency found
) else (
    echo ⚠️  pdfkit not in package.json
)

findstr /C:"exceljs" Backend\package.json >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ exceljs dependency found
) else (
    echo ⚠️  exceljs not in package.json
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo 📊 New API Endpoints Available:
echo.
echo Registration (6 endpoints):
echo   POST /api/registration/organization
echo   POST /api/registration/user
echo   GET  /api/registration/verify-email/:token
echo   POST /api/registration/resend-verification
echo   POST /api/registration/forgot-password
echo   POST /api/registration/reset-password
echo.
echo Messaging (8 endpoints):
echo   GET    /api/messages
echo   GET    /api/messages/conversations
echo   GET    /api/messages/thread/:userId
echo   GET    /api/messages/:id
echo   POST   /api/messages
echo   PUT    /api/messages/:id/read
echo   DELETE /api/messages/:id
echo   GET    /api/messages/unread/count
echo.
echo Analytics (4 endpoints):
echo   GET /api/analytics/dashboard
echo   GET /api/analytics/forecast
echo   GET /api/analytics/spending-patterns
echo   GET /api/analytics/comparison
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

:end
echo.
echo 📚 Documentation Files:
echo   - ENHANCED_FEATURES_DOCUMENTATION.md (Complete API reference)
echo   - QUICK_START_ENHANCED.md (5-minute setup guide)
echo   - FEATURES_SUMMARY.md (Implementation details)
echo   - README_ENHANCED.md (Overview and quickstart)
echo.
echo 🚀 To start the enhanced server:
echo   Option 1: Double-click start.bat
echo   Option 2: Run install-enhanced.bat
echo   Option 3: cd Backend && npm start
echo.
echo 🧪 To test the features:
echo   1. Start the server
echo   2. Visit http://localhost:5000/
echo   3. Should show version 2.0.0
echo   4. Use Postman to test endpoints
echo   5. Check QUICK_START_ENHANCED.md for examples
echo.
pause
