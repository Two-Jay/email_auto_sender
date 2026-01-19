#!/bin/bash

echo "================================"
echo "Email Auto Sender 종료"
echo "================================"

# 백엔드 종료
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    echo "백엔드 종료 중 (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null
    rm backend.pid
    echo "백엔드 종료됨"
else
    echo "백엔드 PID 파일을 찾을 수 없습니다"
fi

# 프론트엔드 종료
if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    echo "프론트엔드 종료 중 (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null
    rm frontend.pid
    echo "프론트엔드 종료됨"
else
    echo "프론트엔드 PID 파일을 찾을 수 없습니다"
fi

echo ""
echo "================================"
echo "서버가 종료되었습니다"
echo "================================"
