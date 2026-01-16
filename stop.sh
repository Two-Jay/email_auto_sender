#!/bin/bash

# 이메일 자동 발신 웹앱 중지 스크립트

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 서버 중지 중...${NC}"
echo ""

# PID 파일에서 프로세스 종료
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID
        echo -e "${GREEN}✅ 백엔드 서버 중지됨 (PID: $BACKEND_PID)${NC}"
    fi
    rm logs/backend.pid
fi

if [ -f logs/frontend.pid ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID
        echo -e "${GREEN}✅ 프론트엔드 서버 중지됨 (PID: $FRONTEND_PID)${NC}"
    fi
    rm logs/frontend.pid
fi

# 프로세스 이름으로 강제 종료
pkill -f "node.*backend/src/server.js" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null

echo ""
echo -e "${GREEN}🎉 모든 서버가 중지되었습니다.${NC}"
echo ""
