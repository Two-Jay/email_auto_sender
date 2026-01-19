#!/bin/bash

echo "================================"
echo "Email Auto Sender 시작"
echo "================================"

# 환경 변수 로드
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "경고: .env 파일이 없습니다. setup.sh를 먼저 실행하세요."
    exit 1
fi

# 백엔드 빌드 및 실행
echo ""
echo "[1/2] 백엔드 시작 중..."
cd backend
source venv/bin/activate

# 백엔드를 백그라운드에서 실행
nohup uvicorn app.main:app --host ${BACKEND_HOST:-0.0.0.0} --port ${BACKEND_PORT:-8000} > ../backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid
echo "백엔드 실행됨 (PID: $BACKEND_PID)"

cd ..

# 프론트엔드 빌드 및 실행
echo ""
echo "[2/2] 프론트엔드 빌드 중..."
cd frontend

# 프론트엔드 빌드
npm run build

# 간단한 HTTP 서버로 프론트엔드 서빙
echo "프론트엔드 실행 중..."
nohup npx serve -s build -l ${FRONTEND_PORT:-3000} > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid
echo "프론트엔드 실행됨 (PID: $FRONTEND_PID)"

cd ..

echo ""
echo "================================"
echo "서버가 실행되었습니다!"
echo "================================"
echo ""
echo "백엔드: http://localhost:${BACKEND_PORT:-8000}"
echo "프론트엔드: http://localhost:${FRONTEND_PORT:-3000}"
echo ""
echo "종료하려면 ./stop.sh를 실행하세요"
echo "로그 확인: tail -f backend.log 또는 tail -f frontend.log"
echo ""
