#!/bin/bash

# ================================
# Email Auto Sender - 개발 모드 스크립트
# ================================
# Hot-reload 지원, 백그라운드 실행 가능

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# PID/포트 정보 저장 디렉토리
PROC_DIR="$SCRIPT_DIR/.proc"
mkdir -p "$PROC_DIR"

# 기본 설정
RUN_BACKGROUND=false
BACKEND_ONLY=false
FRONTEND_ONLY=false

# 인자 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--background)
            RUN_BACKGROUND=true
            shift
            ;;
        --backend)
            BACKEND_ONLY=true
            shift
            ;;
        --frontend)
            FRONTEND_ONLY=true
            shift
            ;;
        -h|--help)
            echo "사용법: ./dev.sh [옵션]"
            echo ""
            echo "옵션:"
            echo "  -b, --background   백그라운드에서 실행"
            echo "  --backend          백엔드만 실행"
            echo "  --frontend         프론트엔드만 실행"
            echo "  -h, --help         도움말 표시"
            echo ""
            echo "개발 모드는 코드 변경 시 자동으로 다시 로드됩니다."
            exit 0
            ;;
        *)
            echo "알 수 없는 옵션: $1"
            echo "./dev.sh --help 로 도움말을 확인하세요."
            exit 1
            ;;
    esac
done

# 환경 변수 로드
load_env() {
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    else
        echo -e "${YELLOW}경고: .env 파일이 없습니다. 기본값을 사용합니다.${NC}"
    fi

    # 기본값 설정
    BACKEND_HOST="${BACKEND_HOST:-0.0.0.0}"
    BACKEND_PORT="${BACKEND_PORT:-8000}"
    FRONTEND_PORT="${FRONTEND_PORT:-3000}"
}

# 포트가 사용 중인지 확인
check_port() {
    local port=$1
    if command -v lsof &> /dev/null; then
        lsof -i :$port -t 2>/dev/null
    elif command -v ss &> /dev/null; then
        ss -tlnp 2>/dev/null | grep ":$port " | awk '{print $6}' | grep -oP 'pid=\K[0-9]+'
    elif command -v netstat &> /dev/null; then
        netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1
    fi
}

# 프로세스가 실행 중인지 확인
is_process_running() {
    local pid=$1
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        return 0
    fi
    return 1
}

# 서비스 상태 확인
check_service_status() {
    local service=$1
    local pid_file="$PROC_DIR/${service}.pid"
    local port_file="$PROC_DIR/${service}.port"

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if is_process_running "$pid"; then
            local port=""
            [ -f "$port_file" ] && port=$(cat "$port_file")
            echo "running:$pid:$port"
            return 0
        else
            rm -f "$pid_file" "$port_file"
        fi
    fi
    echo "stopped"
    return 1
}

# 백엔드 시작 (개발 모드)
start_backend_dev() {
    echo -e "\n${GREEN}[백엔드] 개발 모드로 시작 중...${NC}"

    local status=$(check_service_status "backend")
    if [[ "$status" == running:* ]]; then
        local pid=$(echo "$status" | cut -d: -f2)
        local port=$(echo "$status" | cut -d: -f3)
        echo -e "${YELLOW}백엔드가 이미 실행 중입니다 (PID: $pid, PORT: $port)${NC}"
        return 1
    fi

    local port_pid=$(check_port "$BACKEND_PORT")
    if [ -n "$port_pid" ]; then
        echo -e "${RED}오류: 포트 $BACKEND_PORT이(가) 이미 사용 중입니다 (PID: $port_pid)${NC}"
        return 1
    fi

    cd "$SCRIPT_DIR/backend"

    if [ ! -d "venv" ]; then
        echo -e "${RED}오류: 가상환경이 없습니다. setup.sh를 먼저 실행하세요.${NC}"
        cd "$SCRIPT_DIR"
        return 1
    fi

    source venv/bin/activate

    if [ "$RUN_BACKGROUND" = true ]; then
        nohup uvicorn app.main:app --reload --host "$BACKEND_HOST" --port "$BACKEND_PORT" > "$SCRIPT_DIR/backend.log" 2>&1 &
        local backend_pid=$!

        sleep 2
        if is_process_running "$backend_pid"; then
            echo "$backend_pid" > "$PROC_DIR/backend.pid"
            echo "$BACKEND_PORT" > "$PROC_DIR/backend.port"
            echo "backend (dev)" > "$PROC_DIR/backend.name"
            echo -e "${GREEN}백엔드 실행됨 (PID: $backend_pid, PORT: $BACKEND_PORT)${NC}"
            echo -e "${BLUE}Hot-reload 활성화됨 - 코드 변경 시 자동 재시작${NC}"
        else
            echo -e "${RED}오류: 백엔드 시작 실패. 로그를 확인하세요: backend.log${NC}"
            cd "$SCRIPT_DIR"
            return 1
        fi
    else
        echo -e "${GREEN}백엔드 실행됨 (PORT: $BACKEND_PORT)${NC}"
        echo -e "${BLUE}Hot-reload 활성화됨 - 코드 변경 시 자동 재시작${NC}"
        echo -e "${YELLOW}종료하려면 Ctrl+C를 누르세요${NC}"
        uvicorn app.main:app --reload --host "$BACKEND_HOST" --port "$BACKEND_PORT"
    fi

    cd "$SCRIPT_DIR"
    return 0
}

# 프론트엔드 시작 (개발 모드)
start_frontend_dev() {
    echo -e "\n${GREEN}[프론트엔드] 개발 모드로 시작 중...${NC}"

    local status=$(check_service_status "frontend")
    if [[ "$status" == running:* ]]; then
        local pid=$(echo "$status" | cut -d: -f2)
        local port=$(echo "$status" | cut -d: -f3)
        echo -e "${YELLOW}프론트엔드가 이미 실행 중입니다 (PID: $pid, PORT: $port)${NC}"
        return 1
    fi

    local port_pid=$(check_port "$FRONTEND_PORT")
    if [ -n "$port_pid" ]; then
        echo -e "${RED}오류: 포트 $FRONTEND_PORT이(가) 이미 사용 중입니다 (PID: $port_pid)${NC}"
        return 1
    fi

    cd "$SCRIPT_DIR/frontend"

    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}node_modules가 없습니다. npm install을 실행합니다...${NC}"
        npm install
    fi

    # PORT 환경변수 설정으로 포트 지정
    export PORT="$FRONTEND_PORT"

    if [ "$RUN_BACKGROUND" = true ]; then
        nohup npm start > "$SCRIPT_DIR/frontend.log" 2>&1 &
        local frontend_pid=$!

        sleep 3
        if is_process_running "$frontend_pid"; then
            echo "$frontend_pid" > "$PROC_DIR/frontend.pid"
            echo "$FRONTEND_PORT" > "$PROC_DIR/frontend.port"
            echo "frontend (dev)" > "$PROC_DIR/frontend.name"
            echo -e "${GREEN}프론트엔드 실행됨 (PID: $frontend_pid, PORT: $FRONTEND_PORT)${NC}"
            echo -e "${BLUE}Hot-reload 활성화됨 - 코드 변경 시 자동 재시작${NC}"
        else
            echo -e "${RED}오류: 프론트엔드 시작 실패. 로그를 확인하세요: frontend.log${NC}"
            cd "$SCRIPT_DIR"
            return 1
        fi
    else
        echo -e "${GREEN}프론트엔드 실행됨 (PORT: $FRONTEND_PORT)${NC}"
        echo -e "${BLUE}Hot-reload 활성화됨 - 코드 변경 시 자동 재시작${NC}"
        echo -e "${YELLOW}종료하려면 Ctrl+C를 누르세요${NC}"
        npm start
    fi

    cd "$SCRIPT_DIR"
    return 0
}

# tmux로 포그라운드 실행
run_with_tmux() {
    if ! command -v tmux &> /dev/null; then
        echo -e "${RED}tmux가 설치되어 있지 않습니다.${NC}"
        echo -e "${YELLOW}다음 중 하나를 선택하세요:${NC}"
        echo "  1. ./dev.sh -b        (백그라운드에서 실행)"
        echo "  2. ./dev.sh --backend (터미널에서 백엔드만 실행)"
        echo "  3. ./dev.sh --frontend(터미널에서 프론트엔드만 실행)"
        echo "  4. tmux 설치 후 다시 시도"
        return 1
    fi

    # 기존 세션 확인
    if tmux has-session -t email_sender 2>/dev/null; then
        echo -e "${YELLOW}이미 tmux 세션이 존재합니다.${NC}"
        echo "  연결: tmux attach -t email_sender"
        echo "  종료: tmux kill-session -t email_sender"
        return 1
    fi

    # tmux 세션 생성
    tmux new-session -d -s email_sender -n dev

    # 백엔드 실행 (왼쪽 창)
    tmux send-keys -t email_sender "cd $SCRIPT_DIR/backend && source venv/bin/activate && uvicorn app.main:app --reload --host $BACKEND_HOST --port $BACKEND_PORT" C-m

    # 프론트엔드 실행 (오른쪽 창)
    tmux split-window -h -t email_sender
    tmux send-keys -t email_sender "cd $SCRIPT_DIR/frontend && PORT=$FRONTEND_PORT npm start" C-m

    echo -e "${GREEN}tmux 세션이 생성되었습니다.${NC}"
    echo ""
    echo "백엔드: http://localhost:${BACKEND_PORT}"
    echo "프론트엔드: http://localhost:${FRONTEND_PORT}"
    echo ""
    echo "세션 연결: tmux attach -t email_sender"
    echo "세션 종료: tmux kill-session -t email_sender"
    echo ""

    # tmux 세션 연결
    tmux attach-session -t email_sender
}

# 메인 실행
main() {
    echo "================================"
    echo "Email Auto Sender 개발 모드"
    echo "================================"

    load_env

    # 특정 서비스만 실행하는 경우
    if [ "$BACKEND_ONLY" = true ]; then
        start_backend_dev
        return $?
    fi

    if [ "$FRONTEND_ONLY" = true ]; then
        start_frontend_dev
        return $?
    fi

    # 백그라운드 모드
    if [ "$RUN_BACKGROUND" = true ]; then
        start_backend_dev
        start_frontend_dev

        echo ""
        echo "================================"
        echo -e "${GREEN}개발 서버가 백그라운드에서 실행 중입니다${NC}"
        echo "================================"
        echo ""
        echo "백엔드: http://localhost:${BACKEND_PORT}"
        echo "프론트엔드: http://localhost:${FRONTEND_PORT}"
        echo ""
        echo "상태 확인: ./status.sh"
        echo "종료하려면: ./stop.sh"
        echo "로그 확인: tail -f backend.log 또는 tail -f frontend.log"
        echo ""
        return 0
    fi

    # 포그라운드 모드 - tmux 사용
    run_with_tmux
}

main "$@"
