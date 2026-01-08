# PowerShell 스크립트로 서버 시작
Write-Host "========================================" -ForegroundColor Green
Write-Host "  할일 관리 앱 - 로컬 서버 시작" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "서버를 시작합니다..." -ForegroundColor Yellow
Write-Host "브라우저에서 http://localhost:8000/index.html 접속하세요" -ForegroundColor Cyan
Write-Host ""
Write-Host "종료하려면 Ctrl+C를 누르세요" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 현재 디렉토리로 이동
Set-Location $PSScriptRoot

# Python HTTP 서버 시작
python -m http.server 8000
