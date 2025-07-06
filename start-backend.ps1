Write-Host "🚀 Starting Car AI Backend..." -ForegroundColor Green
Write-Host ""

# Kill any existing process on port 8001
Write-Host "🔍 Checking port 8001..." -ForegroundColor Yellow
try {
    npx kill-port 8001
    Write-Host "✅ Port 8001 cleared" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Port 8001 check completed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Starting backend server..." -ForegroundColor Cyan

# Change to BE directory and start the server
Set-Location BE
npm run dev

# Keep the window open if there's an error
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Backend failed to start. Press any key to exit..." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} 