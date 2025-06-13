@echo off
echo Menjalankan Tiny Cats App dengan konsol terpisah...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.

:: Jalankan backend dalam konsol terpisah
start cmd /k "cd Backend && python main.py"

:: Tunggu 3 detik
echo Menunggu backend siap...
timeout /t 3 /nobreak > nul

:: Jalankan frontend dalam konsol terpisah
start cmd /k "npm run start:frontend"

echo.
echo Aplikasi berjalan di konsol terpisah.
echo Untuk menghentikan, tutup konsol tersebut.
echo. 