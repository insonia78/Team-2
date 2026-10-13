# Start hackathon-service and gateway from repo root (two windows)
$root = Split-Path -Parent $PSScriptRoot

Write-Host "Team-2 dev startup"
Write-Host "Root: $root"
Write-Host ""
Write-Host "Opening hackathon-service (port 4001) in a new window..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\services\hackathon-service'; npm run dev"

Start-Sleep -Seconds 2

Write-Host "Opening gateway (port 4000) in a new window..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\gateway'; npm run dev"

Write-Host ""
Write-Host "When both are running, test:"
Write-Host "  curl.exe http://localhost:4000/health/ready"
Write-Host "  curl.exe http://localhost:4000/api/hackathons"
