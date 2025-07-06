@echo off
echo 🚀 Starting Car AI Backend...
echo.

REM Kill any existing process on port 8001
echo 🔍 Checking port 8001...
npx kill-port 8001
if %errorlevel% equ 0 (
    echo ✅ Port 8001 cleared
) else (
    echo ⚠️ Port 8001 check completed
)

echo.
echo 📦 Starting backend server...
cd BE
npm run dev

pause 