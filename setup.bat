@echo off
echo =======================================================
echo 3D Printer Sitesi - Kurulum Baslatiliyor...
echo =======================================================

echo.
echo [1/3] Backend (Python) sanal ortami kuruluyor...
cd backend
if not exist ".venv" (
    python -m venv .venv
    echo Sanal ortam (virtual environment) olusturuldu.
) else (
    echo Sanal ortam zaten mevcut.
)

echo.
echo [2/4] Backend gereksinimleri yukleniyor...
call .venv\Scripts\activate.bat
pip install -r requirements.txt

echo.
echo [3/4] Veritabani hazirlaniyor...
python setup_db.py
cd ..

echo.
echo [4/4] Frontend (Node.js) paketleri yukleniyor...
cd frontend
call npm install
cd ..

echo.
echo =======================================================
echo Kurulum basariyla tamamlandi!
echo Artik "start.bat" dosyasina tiklayarak projeyi calistirabilirsiniz.
echo =======================================================
pause
