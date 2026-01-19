#!/bin/bash

# ================================
# Email Auto Sender - 시작 스크립트
# ================================
# 프로세스 관리 및 중복 실행 방지 기능 포함

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# PID/포트 정보 저장 디렉토리
PROC_DIR="$SCRIPT_DIR/.proc"
mkdir -p "$PROC_DIR"

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
            # PID 파일은 있지만 프로세스가 없음 - 정리
            rm -f "$pid_file" "$port_file"
        fi
    fi
    echo "stopped"
    return 1
}

# 백엔드 시작
start_backend() {
    echo -e "\n${GREEN}[1/2] 백엔드 시작 중...${NC}"

    local status=$(check_service_status "backend")
    if [[ "$status" == running:* ]]; then
        local pid=$(echo "$status" | cut -d: -f2)
        local port=$(echo "$status" | cut -d: -f3)
        echo -e "${YELLOW}백엔드가 이미 실행 중입니다 (PID: $pid, PORT: $port)${NC}"
        return 1
    fi

    # 포트 사용 확인
    local port_pid=$(check_port "$BACKEND_PORT")
    if [ -n "$port_pid" ]; then
        echo -e "${RED}오류: 포트 $BACKEND_PORT이(가) 이미 사용 중입니다 (PID: $port_pid)${NC}"
        echo -e "${YELLOW}해당 프로세스를 종료하거나 다른 포트를 사용하세요.${NC}"
        return 1
    fi

    cd "$SCRIPT_DIR/backend"

    if [ ! -d "venv" ]; then
        echo -e "${RED}오류: 가상환경이 없습니다. setup.sh를 먼저 실행하세요.${NC}"
        cd "$SCRIPT_DIR"
        return 1
    fi

    source venv/bin/activate

    nohup uvicorn app.main:app --host "$BACKEND_HOST" --port "$BACKEND_PORT" > "$SCRIPT_DIR/backend.log" 2>&1 &
    local backend_pid=$!

    # 프로세스가 제대로 시작되었는지 확인 (2초 대기)
    sleep 2
    if is_process_running "$backend_pid"; then
        echo "$backend_pid" > "$PROC_DIR/backend.pid"
        echo "$BACKEND_PORT" > "$PROC_DIR/backend.port"
        echo "backend" > "$PROC_DIR/backend.name"
        echo -e "${GREEN}백엔드 실행됨 (PID: $backend_pid, PORT: $BACKEND_PORT)${NC}"
    else
        echo -e "${RED}오류: 백엔드 시작 실패. 로그를 확인하세요: backend.log${NC}"
        cd "$SCRIPT_DIR"
        return 1
    fi

    cd "$SCRIPT_DIR"
    return 0
}

# 프론트엔드 시작
start_frontend() {
    echo -e "\n${GREEN}[2/2] 프론트엔드 시작 중...${NC}"

    local status=$(check_service_status "frontend")
    if [[ "$status" == running:* ]]; then
        local pid=$(echo "$status" | cut -d: -f2)
        local port=$(echo "$status" | cut -d: -f3)
        echo -e "${YELLOW}프론트엔드가 이미 실행 중입니다 (PID: $pid, PORT: $port)${NC}"
        return 1
    fi

    # 포트 사용 확인
    local port_pid=$(check_port "$FRONTEND_PORT")
    if [ -n "$port_pid" ]; then
        echo -e "${RED}오류: 포트 $FRONTEND_PORT이(가) 이미 사용 중입니다 (PID: $port_pid)${NC}"
        echo -e "${YELLOW}해당 프로세스를 종료하거나 다른 포트를 사용하세요.${NC}"
        return 1
    fi

    cd "$SCRIPT_DIR/frontend"

    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}node_modules가 없습니다. npm install을 실행합니다...${NC}"
        npm install
    fi

    # 빌드 확인
    if [ ! -d "build" ]; then
        echo -e "${YELLOW}빌드 폴더가 없습니다. npm run build를 실행합니다...${NC}"
        npm run build
    fi

    nohup npx serve -s build -l "$FRONTEND_PORT" > "$SCRIPT_DIR/frontend.log" 2>&1 &
    local frontend_pid=$!

    # 프로세스가 제대로 시작되었는지 확인 (2초 대기)
    sleep 2
    if is_process_running "$frontend_pid"; then
        echo "$frontend_pid" > "$PROC_DIR/frontend.pid"
        echo "$FRONTEND_PORT" > "$PROC_DIR/frontend.port"
        echo "frontend" > "$PROC_DIR/frontend.name"
        echo -e "${GREEN}프론트엔드 실행됨 (PID: $frontend_pid, PORT: $FRONTEND_PORT)${NC}"
    else
        echo -e "${RED}오류: 프론트엔드 시작 실패. 로그를 확인하세요: frontend.log${NC}"
        cd "$SCRIPT_DIR"
        return 1
    fi

    cd "$SCRIPT_DIR"
    return 0
}

# 메인 실행
main() {
    echo "================================"
    echo "Email Auto Sender 시작"
    echo "================================"

    load_env

    local backend_result=0
    local frontend_result=0

    start_backend
    backend_result=$?

    start_frontend
    frontend_result=$?

    echo ""
    echo "================================"
    if [ $backend_result -eq 0 ] || [ $frontend_result -eq 0 ]; then
        echo -e "${GREEN}서버가 실행되었습니다!${NC}"
    else
        echo -e "${YELLOW}일부 서비스가 이미 실행 중입니다.${NC}"
    fi
    echo "================================"
    echo ""
    echo "백엔드: http://localhost:${BACKEND_PORT}"
    echo "프론트엔드: http://localhost:${FRONTEND_PORT}"
    echo ""
    echo "상태 확인: ./status.sh"
    echo "종료하려면: ./stop.sh"
    echo "로그 확인: tail -f backend.log 또는 tail -f frontend.log"
    echo ""
}

main "$@"
