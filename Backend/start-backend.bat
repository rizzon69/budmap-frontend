@echo off
echo.
echo Killing any process on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000"') do (
    taskkill /F /PID %%a 2>nul
)
echo Done. Starting backend...
echo.
cd /d "%~dp0"
node server.js
