@echo off
echo Menjalankan Tiny Cats App...
echo.
echo [INFO] Pastikan Node.js dan Python sudah terinstal.
echo [INFO] Pastikan FFmpeg sudah terinstal dan tersedia di PATH.
echo.

REM Periksa apakah Node.js terinstal
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js tidak ditemukan. Silakan instal Node.js terlebih dahulu.
    goto :eof
)

REM Periksa apakah Python terinstal
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python tidak ditemukan. Silakan instal Python terlebih dahulu.
    goto :eof
)

REM Periksa apakah FFmpeg terinstal
where ffmpeg >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARNING] FFmpeg tidak ditemukan di PATH. Video generation mungkin tidak akan bekerja.
    echo [INFO] Anda dapat menginstal FFmpeg dengan menjalankan 'choco install ffmpeg' (jika menggunakan Chocolatey).
    echo.
)

REM Periksa apakah concurrently sudah terinstal
if not exist node_modules\concurrently (
    echo [INFO] Menginstal dependencies npm...
    call npm install
)

REM Periksa apakah dependencies backend sudah terinstal
if not exist Backend\venv (
    echo [INFO] Membuat virtual environment Python...
    python -m venv Backend\venv
    call Backend\venv\Scripts\activate.bat
    
    echo [INFO] Menginstal dependencies Python...
    cd Backend
    pip install -r requirements.txt
    cd ..
) else (
    call Backend\venv\Scripts\activate.bat
)

echo.
echo [INFO] Menjalankan aplikasi...
echo [INFO] Frontend: http://localhost:5173
echo [INFO] Backend: http://localhost:8000
echo [INFO] API Docs: http://localhost:8000/docs
echo.
echo [INFO] Tekan Ctrl+C untuk menghentikan aplikasi.
echo.

REM Jalankan aplikasi dengan npm
call npm run dev 