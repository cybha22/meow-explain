# Tiny Cats App Launcher (PowerShell)
Write-Host "Menjalankan Tiny Cats App..." -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] Pastikan Node.js dan Python sudah terinstal." -ForegroundColor Gray
Write-Host "[INFO] Pastikan FFmpeg sudah terinstal dan tersedia di PATH." -ForegroundColor Gray
Write-Host ""

# Periksa apakah Node.js terinstal
try {
    $nodeVersion = node -v
    Write-Host "[OK] Node.js terdeteksi: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js tidak ditemukan. Silakan instal Node.js terlebih dahulu." -ForegroundColor Red
    exit
}

# Periksa apakah Python terinstal
try {
    $pythonVersion = python --version
    Write-Host "[OK] Python terdeteksi: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python tidak ditemukan. Silakan instal Python terlebih dahulu." -ForegroundColor Red
    exit
}

# Periksa apakah FFmpeg terinstal
try {
    $ffmpegVersion = ffmpeg -version
    Write-Host "[OK] FFmpeg terdeteksi" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] FFmpeg tidak ditemukan di PATH. Video generation mungkin tidak akan bekerja." -ForegroundColor Yellow
    Write-Host "[INFO] Anda dapat menginstal FFmpeg dengan menjalankan 'choco install ffmpeg' (jika menggunakan Chocolatey)." -ForegroundColor Gray
    Write-Host ""
}

# Periksa apakah concurrently sudah terinstal
if (-not (Test-Path -Path "node_modules\concurrently")) {
    Write-Host "[INFO] Menginstal dependencies npm..." -ForegroundColor Cyan
    npm install
}

# Periksa apakah dependencies backend sudah terinstal
if (-not (Test-Path -Path "Backend\venv")) {
    Write-Host "[INFO] Membuat virtual environment Python..." -ForegroundColor Cyan
    python -m venv Backend\venv
    
    # Aktifkan virtual environment
    & Backend\venv\Scripts\Activate.ps1
    
    Write-Host "[INFO] Menginstal dependencies Python..." -ForegroundColor Cyan
    Push-Location Backend
    pip install -r requirements.txt
    Pop-Location
} else {
    # Aktifkan virtual environment
    & Backend\venv\Scripts\Activate.ps1
}

Write-Host ""
Write-Host "[INFO] Menjalankan aplikasi..." -ForegroundColor Cyan
Write-Host "[INFO] Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "[INFO] Backend: http://localhost:8000" -ForegroundColor Green
Write-Host "[INFO] API Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "[INFO] Tekan Ctrl+C untuk menghentikan aplikasi." -ForegroundColor Yellow
Write-Host ""

# Jalankan aplikasi dengan npm
npm run dev 