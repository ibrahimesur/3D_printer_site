#!/usr/bin/env bash
set -e

echo "======================================================="
echo "3D Printer Sitesi - Backend ve Frontend Baslatiliyor..."
echo "======================================================="

# Scriptin bulundugu dizine gec
cd "$(dirname "$0")"
ROOT_DIR="$(pwd)"

BACKEND_PORT=8001
FRONTEND_PORT=3000
BACKEND_LOG="/tmp/3dprinter_backend.log"
FRONTEND_LOG="/tmp/3dprinter_frontend.log"

# Portu kullanan eski (yarim kalmis) process'leri temizle
free_port() {
  local port=$1
  local pids
  pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "Port $port kullanimda, eski process'ler kapatiliyor (PID: $pids)..."
    kill $pids 2>/dev/null || true
    sleep 1
    # Hala kapanmadiysa zorla kapat
    pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
    [ -n "$pids" ] && kill -9 $pids 2>/dev/null || true
  fi
}

# Sunucular kapatildiginda her iki process'i ve cocuklarini durdur
cleanup() {
  echo
  echo "Sunucular durduruluyor..."
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  # Port uzerinde kalan child process'leri de temizle
  sleep 1
  free_port "$BACKEND_PORT"
  free_port "$FRONTEND_PORT"
  exit 0
}
trap cleanup INT TERM

# Onceki calistirmalardan kalan process'leri temizle
free_port "$BACKEND_PORT"
free_port "$FRONTEND_PORT"

# Backend (FastAPI) - port 8001
echo "Backend (FastAPI) baslatiliyor -> http://localhost:$BACKEND_PORT"
(
  cd "$ROOT_DIR/backend"
  source .venv/bin/activate
  exec python -m uvicorn app.main:app --port "$BACKEND_PORT" --reload
) > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# Frontend (Next.js) - port 3000
echo "Frontend (Next.js) baslatiliyor -> http://localhost:$FRONTEND_PORT"
(
  cd "$ROOT_DIR/frontend"
  exec npm run dev
) > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

# Backend'in gercekten ayaga kalktigini dogrula
echo "Backend'in hazir olmasi bekleniyor..."
BACKEND_READY=0
for i in $(seq 1 30); do
  if curl -s -o /dev/null "http://localhost:$BACKEND_PORT/docs"; then
    BACKEND_READY=1
    break
  fi
  # Process oldu mu kontrol et
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    break
  fi
  sleep 1
done

if [ "$BACKEND_READY" -ne 1 ]; then
  echo
  echo "HATA: Backend baslatilamadi! Log ($BACKEND_LOG):"
  echo "-------------------------------------------------------"
  tail -n 30 "$BACKEND_LOG"
  echo "-------------------------------------------------------"
  cleanup
fi
echo "Backend hazir: http://localhost:$BACKEND_PORT"

# Frontend'in hazir olmasini bekle
echo "Frontend'in hazir olmasi bekleniyor..."
for i in $(seq 1 60); do
  if curl -s -o /dev/null "http://localhost:$FRONTEND_PORT"; then
    break
  fi
  sleep 1
done

# Varsayilan tarayicida ac
echo "Tarayici aciliyor: http://localhost:$FRONTEND_PORT"
open "http://localhost:$FRONTEND_PORT" 2>/dev/null || true

echo
echo "Baslatma tamamlandi. Durdurmak icin bu pencerede Ctrl+C'ye basin."
echo "Backend log : $BACKEND_LOG"
echo "Frontend log: $FRONTEND_LOG"

# Her iki process de calistigi surece bekle
wait
