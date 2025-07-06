@echo off
echo 🚀 Starting Car AI Backend Server (Safe Mode)...
echo.

echo 📋 Checking for existing processes on port 8001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001') do (
    echo Found process %%a using port 8001
    echo Killing process %%a...
    taskkill /PID %%a /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ Successfully killed process %%a
    ) else (
        echo ⚠️ Could not kill process %%a (may not exist)
    )
)

echo.
echo 🕐 Waiting 2 seconds for port to be released...
timeout /t 2 /nobreak >nul

echo.
echo 🚀 Starting server...
npm run dev

pause 