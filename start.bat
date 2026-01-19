@echo off
chcp 65001 >nul
echo ================================
echo Email Auto Sender 시작
echo ================================

REM 환경 변수 확인
if not exist .env (
    echo 오류: .env 파일이 없습니다. setup.bat를 먼저 실행하세요.
    pause
    exit /b 1
)

REM 백엔드 실행
echo.
echo [1/2] 백엔드 시작 중...
cd backend
start "Email Auto Sender - Backend" cmd /k "call venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000"
cd ..

REM 잠시 대기 (백엔드 시작 대기)
timeout /t 3 /nobreak >nul

REM 프론트엔드 빌드 및 실행
echo.
echo [2/2] 프론트엔드 시작 중...
cd frontend

REM 프론트엔드 빌드 (이미 빌드된 경우 스킵)
if not exist build (
    echo 프론트엔드 빌드 중... (첫 실행시에만)
    call npm run build
)

REM 프론트엔드 실행
start "Email Auto Sender - Frontend" cmd /k "npx serve -s build -l 3000"
cd ..

echo.
echo ================================
echo 서버가 실행되었습니다!
echo ================================
echo.
echo 백엔드: http://localhost:8000
echo 프론트엔드: http://localhost:3000
echo.
echo 종료하려면 두 개의 콘솔 창을 모두 닫거나
echo stop.bat를 실행하세요
echo.
echo 5초 후 브라우저가 자동으로 열립니다...
timeout /t 5 /nobreak >nul
start http://localhost:3000
