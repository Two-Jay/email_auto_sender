#!/bin/bash

# 이메일 자동 발신 웹앱 개발 모드 실행 스크립트
# 두 개의 터미널 창에서 백엔드와 프론트엔드를 각각 실행합니다

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📧 개발 모드로 실행합니다...${NC}"
echo ""

# .env 파일 확인
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env 파일이 없습니다. .env.example을 복사합니다.${NC}"
    cp .env.example .env
    echo -e "${YELLOW}📝 .env 파일을 열어서 SMTP 설정을 입력해주세요!${NC}"
    echo ""
fi

# 의존성 설치 확인
if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  의존성이 설치되지 않았습니다.${NC}"
    echo -e "${BLUE}설치를 시작합니다...${NC}"
    ./setup.sh
    if [ $? -ne 0 ]; then
        exit 1
    fi
fi

echo -e "${GREEN}두 개의 터미널 창이 열립니다:${NC}"
echo -e "  1️⃣  백엔드 서버 (포트 5000)"
echo -e "  2️⃣  프론트엔드 서버 (포트 3000)"
echo ""
echo -e "${YELLOW}Ctrl+C로 각 터미널에서 서버를 종료할 수 있습니다.${NC}"
echo ""

# 터미널 에뮬레이터 감지 및 실행
if command -v gnome-terminal &> /dev/null; then
    # GNOME Terminal
    gnome-terminal --tab --title="Backend Server" -- bash -c "cd backend && npm run dev; exec bash"
    gnome-terminal --tab --title="Frontend Server" -- bash -c "cd frontend && npm start; exec bash"
elif command -v xterm &> /dev/null; then
    # xterm
    xterm -T "Backend Server" -e "cd backend && npm run dev; bash" &
    xterm -T "Frontend Server" -e "cd frontend && npm start; bash" &
elif command -v konsole &> /dev/null; then
    # KDE Konsole
    konsole --new-tab -e "cd backend && npm run dev; bash" &
    konsole --new-tab -e "cd frontend && npm start; bash" &
else
    # 터미널을 찾을 수 없으면 백그라운드로 실행
    echo -e "${YELLOW}⚠️  터미널 에뮬레이터를 찾을 수 없습니다.${NC}"
    echo -e "${BLUE}대신 start.sh를 사용하여 백그라운드로 실행합니다...${NC}"
    ./start.sh
fi
