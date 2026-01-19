#!/bin/bash

# ================================
# Email Auto Sender - 상태 확인 스크립트
# ================================

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

# 환경 변수 로드
load_env() {
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi

    # 기본값 설정
    BACKEND_PORT="${BACKEND_PORT:-8000}"
    FRONTEND_PORT="${FRONTEND_PORT:-3000}"
}

# 포트로 프로세스 찾기
find_process_by_port() {
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

# 프로세스 실행 시간 확인
get_process_uptime() {
    local pid=$1
    if command -v ps &> /dev/null; then
        ps -p "$pid" -o etime= 2>/dev/null | xargs
    fi
}

# 프로세스 메모리 사용량 확인
get_process_memory() {
    local pid=$1
    if command -v ps &> /dev/null; then
        local mem=$(ps -p "$pid" -o rss= 2>/dev/null | xargs)
        if [ -n "$mem" ]; then
            # KB to MB 변환
            echo "$((mem / 1024))MB"
        fi
    fi
}

# 서비스 상태 확인
check_service() {
    local service=$1
    local default_port=$2

    local pid_file="$PROC_DIR/${service}.pid"
    local port_file="$PROC_DIR/${service}.port"
    local name_file="$PROC_DIR/${service}.name"

    local service_name=$([ -f "$name_file" ] && cat "$name_file" || echo "$service")
    local pid=""
    local port="$default_port"
    local status="stopped"
    local uptime=""
    local memory=""

    # PID 파일에서 정보 읽기
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        [ -f "$port_file" ] && port=$(cat "$port_file")

        if is_process_running "$pid"; then
            status="running"
            uptime=$(get_process_uptime "$pid")
            memory=$(get_process_memory "$pid")
        else
            # PID 파일은 있지만 프로세스가 없음
            status="stale"
        fi
    fi

    # PID 파일이 없거나 상태가 없으면 포트로 확인
    if [ "$status" = "stopped" ] || [ "$status" = "stale" ]; then
        local port_pid=$(find_process_by_port "$port")
        if [ -n "$port_pid" ]; then
            pid="$port_pid"
            status="running (unmanaged)"
            uptime=$(get_process_uptime "$pid")
            memory=$(get_process_memory "$pid")
        fi
    fi

    # 출력
    echo -e "\n${BLUE}[$service_name]${NC}"
    printf "  %-12s: " "상태"

    case "$status" in
        "running")
            echo -e "${GREEN}실행 중${NC}"
            ;;
        "running (unmanaged)")
            echo -e "${YELLOW}실행 중 (관리되지 않음)${NC}"
            ;;
        "stale")
            echo -e "${YELLOW}비정상 종료됨 (PID 파일 남음)${NC}"
            ;;
        *)
            echo -e "${RED}중지됨${NC}"
            ;;
    esac

    if [ -n "$pid" ]; then
        printf "  %-12s: %s\n" "PID" "$pid"
    fi
    printf "  %-12s: %s\n" "포트" "$port"

    if [ "$status" = "running" ] || [ "$status" = "running (unmanaged)" ]; then
        printf "  %-12s: http://localhost:%s\n" "URL" "$port"
        [ -n "$uptime" ] && printf "  %-12s: %s\n" "실행 시간" "$uptime"
        [ -n "$memory" ] && printf "  %-12s: %s\n" "메모리" "$memory"
    fi
}

# 로그 파일 정보
show_log_info() {
    echo -e "\n${BLUE}[로그 파일]${NC}"

    for log_file in backend.log frontend.log; do
        if [ -f "$log_file" ]; then
            local size=$(du -h "$log_file" 2>/dev/null | cut -f1)
            local modified=$(stat -c '%y' "$log_file" 2>/dev/null | cut -d'.' -f1)
            printf "  %-16s: %s (마지막 수정: %s)\n" "$log_file" "$size" "$modified"
        fi
    done
}

# 사용 가능한 명령어 표시
show_commands() {
    echo -e "\n${BLUE}[사용 가능한 명령어]${NC}"
    echo "  ./start.sh        - 서버 시작"
    echo "  ./stop.sh         - 서버 종료"
    echo "  ./stop.sh -f      - 서버 강제 종료"
    echo "  ./dev.sh          - 개발 모드로 시작"
    echo "  ./status.sh       - 상태 확인 (현재)"
    echo ""
    echo "  tail -f backend.log   - 백엔드 로그 실시간 확인"
    echo "  tail -f frontend.log  - 프론트엔드 로그 실시간 확인"
}

# 메인 실행
main() {
    echo "================================"
    echo "Email Auto Sender 상태"
    echo "================================"

    load_env

    check_service "backend" "$BACKEND_PORT"
    check_service "frontend" "$FRONTEND_PORT"

    show_log_info
    show_commands

    echo ""
}

main "$@"
