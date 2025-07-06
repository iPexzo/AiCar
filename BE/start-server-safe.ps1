Write-Host "🚀 Starting Car AI Backend Server (Safe Mode)..." -ForegroundColor Green
Write-Host ""

Write-Host "📋 Checking for existing processes on port 8001..." -ForegroundColor Yellow

# Get processes using port 8001
$processes = Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess

if ($processes) {
    foreach ($pid in $processes) {
        try {
            $processName = (Get-Process -Id $pid -ErrorAction SilentlyContinue).ProcessName
            Write-Host "Found process $pid ($processName) using port 8001" -ForegroundColor Yellow
            Write-Host "Killing process $pid..." -ForegroundColor Yellow
            
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "✅ Successfully killed process $pid" -ForegroundColor Green
        }
        catch {
            Write-Host "⚠️ Could not kill process $pid" -ForegroundColor Red
        }
    }
} else {
    Write-Host "✅ No processes found using port 8001" -ForegroundColor Green
}

Write-Host ""
Write-Host "🕐 Waiting 2 seconds for port to be released..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "🚀 Starting server..." -ForegroundColor Green
npm run dev 