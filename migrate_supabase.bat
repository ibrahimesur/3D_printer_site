@echo off
echo =======================================================
echo 3D Printer Sitesi - Supabase (Bulut Veritabani) Gecisi
echo =======================================================

cd backend
if not exist ".venv\Scripts\activate.bat" (
    echo [HATA] Sanal ortam bulunamadi! Lutfen once setup.bat'i calistirin.
    pause
    exit /b
)

call .venv\Scripts\activate.bat
echo [1/2] Yeni Postgres kutuphaneleri (pg8000) kuruluyor...
pip install -r requirements.txt

echo.
echo [2/2] Supabase uzerinde tablolar olusturuluyor...
python setup_db.py

cd ..
echo.
echo =======================================================
echo Gecis tamamlandi! Artik start.bat ile siteyi baslatabilirsiniz.
echo =======================================================
pause
