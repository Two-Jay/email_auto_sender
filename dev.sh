#!/bin/bash

echo "================================"
echo "Email Auto Sender 개발 모드"
echo "================================"

# 환경 변수 로드
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "경고: .env 파일이 없습니다. setup.sh를 먼저 실행하세요."
    exit 1
fi

echo ""
echo "개발 서버를 시작합니다..."
echo "백엔드: http://localhost:${BACKEND_PORT:-8000}"
echo "프론트엔드: http://localhost:${FRONTEND_PORT:-3000}"
echo ""
echo "종료하려면 Ctrl+C를 누르세요"
echo ""

# tmux가 설치되어 있으면 사용, 아니면 순차 실행
if command -v tmux &> /dev/null; then
    # tmux 세션 생성
    tmux new-session -d -s email_sender

    # 백엔드 실행 (첫 번째 창)
    tmux send-keys -t email_sender "cd backend && source venv/bin/activate && uvicorn app.main:app --reload --host ${BACKEND_HOST:-0.0.0.0} --port ${BACKEND_PORT:-8000}" C-m

    # 프론트엔드 실행 (두 번째 창)
    tmux split-window -h -t email_sender
    tmux send-keys -t email_sender "cd frontend && npm start" C-m

    # tmux 세션 연결
    tmux attach-session -t email_sender
else
    echo "tmux가 설치되어 있지 않습니다."
    echo "백엔드와 프론트엔드를 별도의 터미널에서 실행하세요:"
    echo ""
    echo "터미널 1:"
    echo "  cd backend"
    echo "  source venv/bin/activate"
    echo "  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    echo ""
    echo "터미널 2:"
    echo "  cd frontend"
    echo "  npm start"
fi
