#!/bin/bash

# 이메일 자동 발신 웹앱 설치 스크립트

echo "📧 이메일 자동 발신 웹앱 설치 시작..."
echo ""

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# .env 파일 확인
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env 파일이 없습니다. .env.example을 복사합니다.${NC}"
    cp .env.example .env
    echo -e "${YELLOW}📝 .env 파일을 열어서 SMTP 설정을 입력해주세요!${NC}"
    echo ""
fi

# 백엔드 설치
echo -e "${BLUE}🔧 백엔드 설치 중...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 백엔드 설치 완료${NC}"
    else
        echo -e "${YELLOW}❌ 백엔드 설치 실패${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ 백엔드 이미 설치됨${NC}"
fi
cd ..

echo ""

# 프론트엔드 설치
echo -e "${BLUE}🎨 프론트엔드 설치 중...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 프론트엔드 설치 완료${NC}"
    else
        echo -e "${YELLOW}❌ 프론트엔드 설치 실패${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ 프론트엔드 이미 설치됨${NC}"
fi
cd ..

echo ""
echo -e "${GREEN}🎉 설치가 완료되었습니다!${NC}"
echo ""
echo -e "${BLUE}다음 단계:${NC}"
echo "1. .env 파일을 열어서 Gmail SMTP 설정을 입력하세요"
echo "   - SMTP_USER=your-email@gmail.com"
echo "   - SMTP_PASS=your-app-password"
echo ""
echo "2. 실행하려면 다음 명령어를 입력하세요:"
echo -e "   ${GREEN}./start.sh${NC}"
echo ""
