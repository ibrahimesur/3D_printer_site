#!/usr/bin/env bash
set -e

echo "======================================================="
echo "3D Printer Sitesi - Kurulum Baslatiliyor... (macOS/Linux)"
echo "======================================================="

# Scriptin bulundugu dizine gec (her yerden calismasi icin)
cd "$(dirname "$0")"

# Python komutunu sec (python3 oncelikli)
if command -v python3 >/dev/null 2>&1; then
  PYTHON=python3
else
  PYTHON=python
fi

echo
echo "[1/4] Backend (Python) sanal ortami kuruluyor..."
cd backend
if [ ! -d ".venv" ]; then
  "$PYTHON" -m venv .venv
  echo "Sanal ortam olusturuldu."
else
  echo "Sanal ortam zaten mevcut."
fi

echo
echo "[2/4] Backend gereksinimleri yukleniyor..."
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo
echo "[3/4] Veritabani hazirlaniyor..."
python setup_db.py
deactivate
cd ..

echo
echo "[4/4] Frontend (Node.js) paketleri yukleniyor..."
cd frontend
npm install
cd ..

echo
echo "======================================================="
echo "Kurulum basariyla tamamlandi!"
echo "Artik \"./start.sh\" komutu ile projeyi calistirabilirsiniz."
echo "======================================================="
