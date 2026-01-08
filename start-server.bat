@echo off
echo Starting local web server...
echo.
echo Server will start at http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

python server.py

if errorlevel 1 (
    echo.
    echo Python이 설치되어 있지 않거나 PATH에 등록되어 있지 않습니다.
    echo.
    echo Python 설치 방법:
    echo 1. https://www.python.org/downloads/ 에서 Python 다운로드
    echo 2. 설치 시 "Add Python to PATH" 옵션 체크
    echo.
    pause
)
