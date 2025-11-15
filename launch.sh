#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

declare -a CHILD_PIDS=()

cleanup() {
  for pid in "${CHILD_PIDS[@]:-}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
}

trap cleanup EXIT

start_service() {
  local name="$1"
  local dir="$2"
  local script="$3"

  if [ ! -d "$dir/node_modules" ]; then
    echo "→ Installing dependencies for $name..."
    (cd "$dir" && npm install)
  fi

  echo "→ Starting $name..."
  (cd "$dir" && npm run "$script") &
  CHILD_PIDS+=($!)
}

start_service "backend API (http://localhost:4000)" "$BACKEND_DIR" dev
start_service "frontend (http://localhost:5173)" "$FRONTEND_DIR" dev

echo ""
echo "Research Assistant is running:"
echo "  Backend API:    http://localhost:4000"
echo "  Frontend (Vite): http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both services."

wait -n
