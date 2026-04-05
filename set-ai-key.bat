@echo off
echo.
echo ================================================
echo   BudMap - Set Google Gemini API Key
echo ================================================
echo.
set /p apikey=Paste your Gemini API key here: 
if "%apikey%"=="" (
    echo No key entered. Cancelled.
    pause
    exit /b
)
echo.
echo Writing key to Backend\.env ...
powershell -Command "(Get-Content 'Backend\.env') -replace 'GEMINI_API_KEY=.*', 'GEMINI_API_KEY=%apikey%' | Set-Content 'Backend\.env'"
echo.
echo Done! Restart your backend for the change to take effect.
echo.
pause
