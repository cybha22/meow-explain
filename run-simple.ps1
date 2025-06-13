# Script sederhana untuk menjalankan Tiny Cats App

# Pindah ke direktori aplikasi (jika perlu)
# $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
# Set-Location $scriptPath

Write-Host "Menjalankan Tiny Cats App..." -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor Green
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "Tekan Ctrl+C untuk menghentikan aplikasi" -ForegroundColor Yellow

# Aktifkan virtual environment jika ada
if (Test-Path -Path "Backend\venv\Scripts\Activate.ps1") {
    & Backend\venv\Scripts\Activate.ps1
}

# Jalankan aplikasi
npm run dev 