@echo off
echo Menjalankan Tiny Cats App...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Tekan Ctrl+C untuk menghentikan aplikasi
echo.

:: Coba jalankan dengan dev:win terlebih dahulu
npm run dev:win
IF %ERRORLEVEL% NEQ 0 (
    echo Mencoba metode alternatif...
    
    :: Metode alternatif: jalankan backend dan frontend secara berurutan
    start cmd /k "cd Backend && python main.py"
    timeout /t 3 /nobreak > nul
    start cmd /k "npm run start:frontend"
) 