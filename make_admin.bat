@echo off
echo =======================================================
echo 3D Printer Sitesi - Admin Yapma Araci
echo =======================================================

cd backend
if not exist ".venv\Scripts\activate.bat" (
    echo [HATA] Sanal ortam bulunamadi! Lutfen once setup.bat'i calistirin.
    pause
    exit /b
)

call .venv\Scripts\activate.bat
python make_admin.py
cd ..
