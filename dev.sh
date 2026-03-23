#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${NC}"

  if [ -n "${EXT_PID:-}" ] && kill -0 "$EXT_PID" 2>/dev/null; then
    echo -e "${CYAN}[extension]${NC} Stopping dev server..."
    kill "$EXT_PID" 2>/dev/null || true
    wait "$EXT_PID" 2>/dev/null || true
  fi

  echo -e "${GREEN}[backend]${NC} Stopping Docker container..."
  docker compose -f "$ROOT_DIR/docker-compose.yml" down 2>/dev/null || true

  echo -e "${RED}[supabase]${NC} Stopping Supabase..."
  (cd "$ROOT_DIR/supabase" && supabase stop) 2>/dev/null || true

  echo -e "${YELLOW}All services stopped.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# --- Preflight checks ---
for cmd in docker supabase pnpm; do
  if ! command -v "$cmd" &>/dev/null; then
    echo -e "${RED}Error: '$cmd' is not installed.${NC}"
    exit 1
  fi
done

if ! docker info &>/dev/null; then
  echo -e "${RED}Error: Docker daemon is not running.${NC}"
  exit 1
fi

# --- 1. Start Supabase ---
echo -e "${RED}[supabase]${NC} Starting Supabase..."
(cd "$ROOT_DIR/supabase" && supabase start)
echo -e "${RED}[supabase]${NC} Ready."

# --- 2. Start backend ---
echo -e "${GREEN}[backend]${NC} Starting FastAPI backend..."
docker compose -f "$ROOT_DIR/docker-compose.yml" up --build -d
echo -e "${GREEN}[backend]${NC} Running at http://localhost:8000"

# --- 3. Start extension dev server ---
echo -e "${CYAN}[extension]${NC} Starting WXT dev server..."
(cd "$ROOT_DIR/extension" && pnpm dev) &
EXT_PID=$!

echo ""
echo -e "${YELLOW}================================================${NC}"
echo -e "${YELLOW}  bubb dev environment is running${NC}"
echo -e "${RED}  [supabase]${NC}   Studio:  http://localhost:54323"
echo -e "${GREEN}  [backend]${NC}    API:     http://localhost:8000"
echo -e "${CYAN}  [extension]${NC}  Load from: extension/.output/chrome-mv3/"
echo -e "${YELLOW}  Press Ctrl+C to stop all services${NC}"
echo -e "${YELLOW}================================================${NC}"
echo ""

# Keep script alive, waiting for the extension dev server
wait "$EXT_PID"
