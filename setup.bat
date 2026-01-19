@echo off
chcp 65001 >nul
echo ================================
echo Email Auto Sender 설치 시작
echo ================================

REM 환경 변수 파일 생성
if not exist .env (
    echo 환경 변수 파일 생성 중...
    copy .env.example .env
    echo .env 파일이 생성되었습니다. 메일 계정 정보를 입력해주세요.
)

REM 백엔드 설정
echo.
echo [1/2] 백엔드 설정 중...
cd backend

REM Python 가상환경 생성
if not exist venv (
    echo Python 가상환경 생성 중...
    python -m venv venv
)

REM 가상환경 활성화 및 패키지 설치
echo Python 패키지 설치 중...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt

cd ..

REM 프론트엔드 설정
echo.
echo [2/2] 프론트엔드 설정 중...
cd frontend

REM Node.js 패키지 설치
echo Node.js 패키지 설치 중...
call npm install

cd ..

echo.
echo ================================
echo 설치가 완료되었습니다!
echo ================================
echo.
echo 다음 단계:
echo 1. .env 파일을 열어 메일 계정 정보를 입력하세요
echo 2. start.bat 명령으로 서버를 실행하세요
echo 3. 개발 모드는 dev.bat 명령을 사용하세요
echo.
pause
