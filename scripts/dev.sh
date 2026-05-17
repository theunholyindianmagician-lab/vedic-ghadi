#!/usr/bin/env bash
# 🔱 dev.sh — start backend + frontend together
# Usage: ./scripts/dev.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PY=${VEDIC_PY:-"python3"}
if [ -x "$HOME/.local/bin/python3.12" ]; then PY="$HOME/.local/bin/python3.12"; fi

echo "🔱 vedic-ghadi · dev mode"
echo "   backend  → http://localhost:8765  (Python · FastAPI)"
echo "   frontend → http://localhost:3030  (Next.js · live ghaḍī)"
echo

# Install backend in editable mode if not already
if ! $PY -c "import vedic_ghadi" 2>/dev/null; then
  echo "[backend] installing in editable mode…"
  $PY -m pip install -e "$ROOT/backend[server]" --quiet
fi

# Install frontend deps if needed
if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "[frontend] installing node_modules…"
  (cd "$ROOT/frontend" && npm install)
fi

# Trap so both processes die together on Ctrl-C
PIDS=()
cleanup() {
  echo
  echo "→ shutting down…"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT INT TERM

(cd "$ROOT/backend" && $PY -m uvicorn vedic_ghadi.api:app --port 8765 --reload) &
PIDS+=($!)

(cd "$ROOT/frontend" && npm run dev) &
PIDS+=($!)

wait
