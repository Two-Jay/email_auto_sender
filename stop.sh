#!/bin/bash

# ================================
# Email Auto Sender - 종료 스크립트
# ================================
# 프로세스 자원 회수 및 정리 기능 포함

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# PID/포트 정보 저장 디렉토리
PROC_DIR="$SCRIPT_DIR/.proc"

# 강제 종료 플래그
FORCE_KILL=false

# 인자 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--force)
            FORCE_KILL=true
            shift
            ;;
        -h|--help)
            echo "사용법: ./stop.sh [옵션]"
            echo ""
            echo "옵션:"
            echo "  -f, --force    강제 종료 (SIGKILL 사용)"
            echo "  -h, --help     도움말 표시"
            exit 0
            ;;
        *)
            echo "알 수 없는 옵션: $1"
            echo "./stop.sh --help 로 도움말을 확인하세요."
            exit 1
            ;;
    esac
done

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

# 프로세스 종료 (graceful shutdown 시도 후 강제 종료)
kill_process() {
    local pid=$1
    local name=$2
    local max_wait=5

    if ! is_process_running "$pid"; then
        return 0
    fi

    if [ "$FORCE_KILL" = true ]; then
        echo -e "  ${YELLOW}강제 종료 중 (SIGKILL)...${NC}"
        kill -9 "$pid" 2>/dev/null
        return $?
    fi

    # 먼저 SIGTERM으로 graceful shutdown 시도
    echo -e "  ${YELLOW}정상 종료 시도 중 (SIGTERM)...${NC}"
    kill "$pid" 2>/dev/null

    # 프로세스가 종료될 때까지 대기
    local waited=0
    while is_process_running "$pid" && [ $waited -lt $max_wait ]; do
        sleep 1
        waited=$((waited + 1))
    done

    # 아직 실행 중이면 SIGKILL
    if is_process_running "$pid"; then
        echo -e "  ${YELLOW}강제 종료 중 (SIGKILL)...${NC}"
        kill -9 "$pid" 2>/dev/null
        sleep 1
    fi

    if is_process_running "$pid"; then
        return 1
    fi
    return 0
}

# 서비스 종료
stop_service() {
    local service=$1
    local port=$2

    local pid_file="$PROC_DIR/${service}.pid"
    local port_file="$PROC_DIR/${service}.port"
    local name_file="$PROC_DIR/${service}.name"
    local stopped=false
    local service_name=$([ -f "$name_file" ] && cat "$name_file" || echo "$service")

    echo -e "\n${GREEN}${service_name} 종료 중...${NC}"

    # PID 파일에서 프로세스 찾기
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        local saved_port=$([ -f "$port_file" ] && cat "$port_file" || echo "$port")

        echo "  PID: $pid, PORT: $saved_port"

        if is_process_running "$pid"; then
            if kill_process "$pid" "$service_name"; then
                echo -e "  ${GREEN}프로세스 종료 완료${NC}"
                stopped=true
            else
                echo -e "  ${RED}프로세스 종료 실패${NC}"
            fi
        else
            echo -e "  ${YELLOW}프로세스가 이미 종료되었습니다${NC}"
            stopped=true
        fi

        # PID 파일 정리
        rm -f "$pid_file" "$port_file" "$name_file"
    fi

    # PID 파일이 없거나 프로세스를 못 찾은 경우 포트로 검색
    if [ "$stopped" = false ] && [ -n "$port" ]; then
        local port_pid=$(find_process_by_port "$port")
        if [ -n "$port_pid" ]; then
            echo "  포트 $port에서 프로세스 발견 (PID: $port_pid)"
            if kill_process "$port_pid" "$service_name"; then
                echo -e "  ${GREEN}프로세스 종료 완료${NC}"
                stopped=true
            else
                echo -e "  ${RED}프로세스 종료 실패${NC}"
            fi
        fi
    fi

    if [ "$stopped" = false ]; then
        echo -e "  ${YELLOW}종료할 프로세스를 찾지 못했습니다${NC}"
    fi
}

# 오래된 PID 파일 정리
cleanup_stale_files() {
    if [ -d "$PROC_DIR" ]; then
        for pid_file in "$PROC_DIR"/*.pid; do
            [ -f "$pid_file" ] || continue
            local pid=$(cat "$pid_file")
            if ! is_process_running "$pid"; then
                local base=$(basename "$pid_file" .pid)
                rm -f "$PROC_DIR/${base}.pid" "$PROC_DIR/${base}.port" "$PROC_DIR/${base}.name"
            fi
        done
    fi
}

# 메인 실행
main() {
    echo "================================"
    echo "Email Auto Sender 종료"
    echo "================================"

    load_env

    # 서비스 종료
    stop_service "backend" "$BACKEND_PORT"
    stop_service "frontend" "$FRONTEND_PORT"

    # 정리
    cleanup_stale_files

    # 레거시 PID 파일 정리 (이전 버전 호환)
    rm -f "$SCRIPT_DIR/backend.pid" "$SCRIPT_DIR/frontend.pid"

    echo ""
    echo "================================"
    echo -e "${GREEN}서버가 종료되었습니다${NC}"
    echo "================================"
    echo ""
}

main "$@"
