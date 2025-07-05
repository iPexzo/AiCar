@echo off
echo Starting Car AI Backend Server...

REM Check if PM2 is installed
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo PM2 not found. Installing PM2...
    npm install -g pm2
)

REM Build the project
echo Building project...
npm run build

REM Check if server is already running
pm2 list | findstr "car-ai-backend" >nul 2>&1
if not errorlevel 1 (
    echo Server already running. Restarting...
    pm2 restart car-ai-backend
) else (
    echo Starting new server instance...
    pm2 start ecosystem.config.js
)

echo.
echo Server started! Check status with: pm2 status
echo View logs with: pm2 logs car-ai-backend
echo Stop server with: pm2 stop car-ai-backend
echo.
pause 