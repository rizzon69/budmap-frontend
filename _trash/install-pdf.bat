@echo off
echo Installing PDF export libraries...
cd /d "%~dp0Frontain"
call npm install jspdf jspdf-autotable
echo.
echo Done! PDF export is now ready.
pause
