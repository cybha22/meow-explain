#!/bin/bash

echo "Menjalankan Tiny Cats App..."
echo ""
echo "[INFO] Pastikan Node.js dan Python sudah terinstal."
echo "[INFO] Pastikan FFmpeg sudah terinstal dan tersedia di PATH."
echo ""

# Periksa apakah Node.js terinstal
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js tidak ditemukan. Silakan instal Node.js terlebih dahulu."
    exit 1
fi

# Periksa apakah Python terinstal
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python tidak ditemukan. Silakan instal Python terlebih dahulu."
    exit 1
fi

# Periksa apakah FFmpeg terinstal
if ! command -v ffmpeg &> /dev/null; then
    echo "[WARNING] FFmpeg tidak ditemukan di PATH. Video generation mungkin tidak akan bekerja."
    echo "[INFO] Anda dapat menginstal FFmpeg dengan package manager:"
    echo "  - Ubuntu/Debian: sudo apt install ffmpeg"
    echo "  - macOS: brew install ffmpeg"
    echo ""
fi

# Periksa apakah concurrently sudah terinstal
if [ ! -d "node_modules/concurrently" ]; then
    echo "[INFO] Menginstal dependencies npm..."
    npm install
fi

# Periksa apakah dependencies backend sudah terinstal
if [ ! -d "Backend/venv" ]; then
    echo "[INFO] Membuat virtual environment Python..."
    python3 -m venv Backend/venv
    source Backend/venv/bin/activate
    echo "[INFO] Menginstal dependencies Python..."
    cd Backend && pip install -r requirements.txt && cd ..
else
    source Backend/venv/bin/activate
fi

echo ""
echo "[INFO] Menjalankan aplikasi..."
echo "[INFO] Frontend: http://localhost:5173"
echo "[INFO] Backend: http://localhost:8000"
echo "[INFO] API Docs: http://localhost:8000/docs"
echo ""
echo "[INFO] Tekan Ctrl+C untuk menghentikan aplikasi."
echo ""

# Jalankan aplikasi dengan npm
npm run dev 