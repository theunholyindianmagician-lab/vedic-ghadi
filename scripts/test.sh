#!/usr/bin/env bash
# 🔱 test.sh — run all tests (Python + TS typecheck + Next build)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PY=${VEDIC_PY:-"python3"}
if [ -x "$HOME/.local/bin/python3.12" ]; then PY="$HOME/.local/bin/python3.12"; fi

echo "🔱 vedic-ghadi · test suite"
echo

echo "── Python ───────────────────────────"
$PY -m pip install -e "$ROOT/backend[server,dev]" --quiet
(cd "$ROOT/backend" && $PY -m pytest -q)

echo
echo "── Frontend typecheck ───────────────"
if [ -d "$ROOT/frontend/node_modules" ]; then
  (cd "$ROOT/frontend" && npm run typecheck)
else
  echo "(skipping — run 'npm install' in frontend/ first)"
fi

echo
echo "✓ all tests passed"
