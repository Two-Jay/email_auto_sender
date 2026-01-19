#!/bin/bash

echo "================================"
echo "Email Auto Sender 설치 시작"
echo "================================"

# 환경 변수 파일 생성
if [ ! -f .env ]; then
    echo "환경 변수 파일 생성 중..."
    cp .env.example .env
    echo ".env 파일이 생성되었습니다. 메일 계정 정보를 입력해주세요."
fi

# 백엔드 설정
echo ""
echo "[1/2] 백엔드 설정 중..."
cd backend

# Python 가상환경 생성
if [ ! -d "venv" ]; then
    echo "Python 가상환경 생성 중..."
    python3 -m venv venv
fi

# 가상환경 활성화 및 패키지 설치
echo "Python 패키지 설치 중..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

cd ..

# 프론트엔드 설정
echo ""
echo "[2/2] 프론트엔드 설정 중..."
cd frontend

# Node.js 패키지 설치
echo "Node.js 패키지 설치 중..."
npm install

cd ..

echo ""
echo "================================"
echo "설치가 완료되었습니다!"
echo "================================"
echo ""
echo "다음 단계:"
echo "1. .env 파일을 열어 메일 계정 정보를 입력하세요"
echo "2. ./start.sh 명령으로 서버를 실행하세요"
echo "3. 개발 모드는 ./dev.sh 명령을 사용하세요"
echo ""
