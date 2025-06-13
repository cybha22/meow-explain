Write-Host "Menjalankan Tiny Cats App..." -ForegroundColor Cyan
Write-Host "Backend: http://localhost:8000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Tekan Ctrl+C untuk menghentikan aplikasi" -ForegroundColor Red
Write-Host ""

# Set environment variable dan jalankan aplikasi
$Env:PYTHONPATH = '.'
cd ./Backend
$backProc = Start-Process -NoNewWindow python -ArgumentList './main.py' -PassThru
Start-Sleep -s 2

# Jalankan frontend
Set-Location ..
npm run start:frontend

# Matikan proses backend saat selesai
Stop-Process -Id $backProc.Id 