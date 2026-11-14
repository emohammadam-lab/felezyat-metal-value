#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=========================================="
echo "  فلزیافت (Felezyaft) - راه‌اندازی پروژه  "
echo "=========================================="

# 1. Run Python Backend
echo "-> در حال اجرای سرور پایتون (FastAPI) روی پورت 8000..."
./backend/venv/bin/python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 2. Run Vite Frontend
echo "-> در حال اجرای فرانت‌اند (Vite/TanStack) روی پورت 5173..."
if command -v bun >/dev/null 2>&1; then
  bun run --bun vite dev --host 0.0.0.0 --port 5173 &
elif [ -f "$HOME/.nodejs/bin/npx" ]; then
  export PATH="$HOME/.nodejs/bin:$PATH"
  npx vite dev --host 0.0.0.0 --port 5173 &
else
  npx vite dev --host 0.0.0.0 --port 5173 &
fi
FRONTEND_PID=$!

cleanup() {
  echo ""
  echo "در حال متوقف‌سازی سرویس‌ها..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo ""
echo "هر دو سرویس با موفقیت اجرا شدند:"
echo "  * فرانت‌اند: http://localhost:5173"
echo "  * بک‌اند پایتون: http://localhost:8000"
echo "  * مستندات API (Swagger): http://localhost:8000/docs"
echo ""
echo "برای توقف کلیدهای Ctrl+C را فشار دهید."
echo "=========================================="

wait

