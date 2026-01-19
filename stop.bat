@echo off
chcp 65001 >nul
echo ================================
echo Email Auto Sender 종료
echo ================================

REM uvicorn 프로세스 종료
echo 백엔드 종료 중...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq Email Auto Sender - Backend*" 2>nul
if %errorlevel% equ 0 (
    echo 백엔드 종료됨
) else (
    echo 실행 중인 백엔드를 찾을 수 없습니다
)

REM serve 프로세스 종료
echo 프론트엔드 종료 중...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Email Auto Sender - Frontend*" 2>nul
if %errorlevel% equ 0 (
    echo 프론트엔드 종료됨
) else (
    echo 실행 중인 프론트엔드를 찾을 수 없습니다
)

echo.
echo ================================
echo 서버가 종료되었습니다
echo ================================
pause
