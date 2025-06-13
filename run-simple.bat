@echo off
echo Menjalankan Tiny Cats App...
echo Frontend: http://localhost:5173
echo Backend: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo Tekan Ctrl+C untuk menghentikan aplikasi

REM Aktifkan virtual environment jika ada
if exist Backend\venv\Scripts\activate.bat (
    call Backend\venv\Scripts\activate.bat
)

REM Jalankan aplikasi
call npm run dev 