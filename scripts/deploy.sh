#!/usr/bin/env bash
# 🔱 deploy.sh — build production artifacts
# - Python wheel  → backend/dist/
# - Next.js build → frontend/.next/
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PY=${VEDIC_PY:-"python3"}
if [ -x "$HOME/.local/bin/python3.12" ]; then PY="$HOME/.local/bin/python3.12"; fi

echo "🔱 vedic-ghadi · build"
echo

echo "── backend wheel ────────────────────"
(cd "$ROOT/backend" && rm -rf dist build *.egg-info
                       && $PY -m pip install --quiet --upgrade build
                       && $PY -m build --wheel)
echo "→ $(ls $ROOT/backend/dist/*.whl)"
echo

echo "── frontend production build ────────"
(cd "$ROOT/frontend" && npm install --silent && npm run build)
echo "→ $ROOT/frontend/.next/"
echo

echo "✓ artifacts ready"
echo "  • backend wheel:  pip install $(ls $ROOT/backend/dist/*.whl)"
echo "  • Next.js prod:   cd frontend && npm start"
echo "  • Vercel deploy:  cd frontend && vercel --prod"
