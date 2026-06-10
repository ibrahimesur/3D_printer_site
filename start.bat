@echo off
echo =======================================================
echo 3D Printer Sitesi - Backend ve Frontend Baslatiliyor...
echo =======================================================

:: Backend'i yeni bir komut istemcisi penceresinde başlatır
start "Backend (FastAPI)" cmd /k "cd backend && .venv\Scripts\activate.bat && uvicorn app.main:app --port 8001"

:: Frontend'i yeni bir komut istemcisi penceresinde başlatır
start "Frontend (Next.js)" cmd /k "cd frontend && npm run dev"

echo Sunucularin hazir olmasi icin kisa bir sure bekleniyor...
timeout /t 5 /nobreak > nul

:: Chrome'u başlatır
echo Chrome tarayici aciliyor...
start chrome "http://localhost:3000"

echo Baslatma islemi tamamlandi. Lutfen acilan pencereleri kapatmayin.
