@echo off
chcp 65001 >nul
echo ================================
echo Email Auto Sender 개발 모드
echo ================================

REM 환경 변수 확인
if not exist .env (
    echo 오류: .env 파일이 없습니다. setup.bat를 먼저 실행하세요.
    pause
    exit /b 1
)

echo.
echo 개발 서버를 시작합니다...
echo 백엔드: http://localhost:8000
echo 프론트엔드: http://localhost:3000
echo.
echo 종료하려면 두 개의 콘솔 창에서 Ctrl+C를 누르세요
echo.

REM 백엔드 실행 (새 콘솔 창)
cd backend
start "Email Auto Sender - Backend (Dev)" cmd /k "call venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
cd ..

REM 잠시 대기
timeout /t 2 /nobreak >nul

REM 프론트엔드 실행 (새 콘솔 창)
cd frontend
start "Email Auto Sender - Frontend (Dev)" cmd /k "npm start"
cd ..

echo.
echo 두 개의 콘솔 창이 열렸습니다.
echo 백엔드와 프론트엔드가 개발 모드로 실행 중입니다.
echo.
pause
