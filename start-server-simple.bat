@echo off
chcp 65001 >nul
cls
echo ========================================
echo   할일 관리 앱 - 로컬 서버 시작
echo ========================================
echo.
echo 서버를 시작합니다...
echo 브라우저에서 http://localhost:8000/index.html 접속하세요
echo.
echo 종료하려면 이 창을 닫거나 Ctrl+C를 누르세요
echo.
echo ========================================
echo.

cd /d "%~dp0"
python -m http.server 8000

pause
