#!/bin/bash

# 이메일 자동 발신 웹앱 실행 스크립트

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📧 이메일 자동 발신 웹앱 시작...${NC}"
echo ""

# .env 파일 확인
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env 파일이 없습니다!${NC}"
    echo -e "${YELLOW}먼저 setup.sh를 실행하여 설치를 완료하세요.${NC}"
    exit 1
fi

# node_modules 확인
if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  의존성이 설치되지 않았습니다.${NC}"
    echo -e "${BLUE}설치를 시작합니다...${NC}"
    ./setup.sh
    if [ $? -ne 0 ]; then
        exit 1
    fi
fi

# 로그 디렉토리 생성
mkdir -p logs

# 기존 프로세스 종료
echo -e "${YELLOW}🔍 기존 프로세스 확인 중...${NC}"
pkill -f "node.*backend/src/server.js" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null
sleep 1

# 백엔드 시작
echo -e "${BLUE}🔧 백엔드 서버 시작 중...${NC}"
cd backend
nohup npm start > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 백엔드 시작 대기
echo -e "${YELLOW}⏳ 백엔드 서버 시작 대기 중...${NC}"
sleep 3

# 백엔드 상태 확인
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ 백엔드 서버 시작됨 (PID: $BACKEND_PID)${NC}"
    echo -e "   ${BLUE}http://localhost:5000${NC}"
else
    echo -e "${RED}❌ 백엔드 서버 시작 실패${NC}"
    echo -e "${YELLOW}로그를 확인하세요: cat logs/backend.log${NC}"
    exit 1
fi

echo ""

# 프론트엔드 시작
echo -e "${BLUE}🎨 프론트엔드 서버 시작 중...${NC}"
cd frontend
nohup npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# 프론트엔드 시작 대기
echo -e "${YELLOW}⏳ 프론트엔드 서버 시작 대기 중...${NC}"
sleep 5

# 프론트엔드 상태 확인
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✅ 프론트엔드 서버 시작됨 (PID: $FRONTEND_PID)${NC}"
    echo -e "   ${BLUE}http://localhost:3000${NC}"
else
    echo -e "${RED}❌ 프론트엔드 서버 시작 실패${NC}"
    echo -e "${YELLOW}로그를 확인하세요: cat logs/frontend.log${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 서버가 성공적으로 시작되었습니다!${NC}"
echo ""
echo -e "${BLUE}접속 정보:${NC}"
echo -e "  📱 프론트엔드: ${GREEN}http://localhost:3000${NC}"
echo -e "  🔧 백엔드 API: ${GREEN}http://localhost:5000${NC}"
echo ""
echo -e "${BLUE}명령어:${NC}"
echo -e "  로그 보기:     ${YELLOW}tail -f logs/backend.log${NC}"
echo -e "                 ${YELLOW}tail -f logs/frontend.log${NC}"
echo -e "  서버 중지:     ${YELLOW}./stop.sh${NC}"
echo ""

# PID 저장
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid
