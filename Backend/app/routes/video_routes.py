from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from fastapi.responses import JSONResponse
from typing import List
import uuid
import os

from app.models.video_models import (
    VideoGenerationRequest,
    VideoGenerationResponse,
    TTSVoiceOption,
    AvailableVoicesResponse
)
from app.services.video_service import VideoService
from app.services.tts_service import TTSService

router = APIRouter(
    prefix="/api/videos",
    tags=["videos"],
)

# Inisialisasi service
video_service = VideoService()
tts_service = TTSService()

@router.get("/voices", response_model=AvailableVoicesResponse)
async def get_available_voices():
    """
    Mendapatkan daftar suara TTS yang tersedia
    """
    voices = tts_service.get_available_voices()
    return {"voices": voices}

@router.post("/generate", response_model=VideoGenerationResponse)
async def generate_video(request: VideoGenerationRequest, background_tasks: BackgroundTasks):
    """
    Menghasilkan video dari slide dan opsi TTS
    
    Contoh request:
    ```json
    {
        "slides": [
            {
                "text": "Ini adalah contoh teks untuk slide pertama",
                "image_url": "https://example.com/image1.jpg",
                "duration": 5.0
            },
            {
                "text": "Ini adalah contoh teks untuk slide kedua",
                "image_url": "https://example.com/image2.jpg",
                "duration": 5.0
            }
        ],
        "tts_options": {
            "language": "id",
            "voice": "id-ID-Standard-A",
            "rate": 1.0,
            "pitch": 1.0,
            "volume": 1.0
        },
        "output_filename": "contoh-video.mp4",
        "min_duration": 35.0
    }
    ```
    """
    # Validasi request
    if not request.slides:
        raise HTTPException(status_code=400, detail="Minimal harus ada satu slide")
    
    # Generate video ID
    video_id = str(uuid.uuid4())
    
    # Override output_filename with video_id
    request.output_filename = f"{video_id}.mp4"
    
    # Proses pembuatan video (bisa dalam background untuk proses yang panjang)
    # Untuk request kecil, kita bisa memproses secara sinkron
    if len(request.slides) <= 3:
        result = video_service.generate_video(request)
        if result["success"]:
            return VideoGenerationResponse(
                success=True,
                video_id=video_id,
                video_url=result["video_url"],
                duration=result["duration"]
            )
        else:
            raise HTTPException(status_code=500, detail=result["error_message"])
    
    # Untuk request yang lebih besar, proses di background
    # Catatan: Untuk implementasi lengkap, Anda perlu sistem antrian dan penyimpanan status
    # Ini adalah implementasi sederhana untuk demo
    def process_video_in_background():
        video_service.generate_video(request)
    
    background_tasks.add_task(process_video_in_background)
    
    return VideoGenerationResponse(
        success=True,
        video_id=video_id,
        video_url=f"/api/videos/status/{video_id}",
        duration=None,
        error_message="Video sedang diproses di background. Silakan cek status nanti."
    )

@router.get("/status/{video_id}")
async def get_video_status(video_id: str):
    """
    Cek status pembuatan video
    """
    # Dalam implementasi nyata, Anda akan memeriksa status dari database atau penyimpanan status
    # Ini adalah implementasi sederhana untuk demo
    
    # Cek apakah file video sudah ada
    video_filename = f"{video_id}.mp4"
    video_path = os.path.join("static/videos", video_filename)
    
    if os.path.exists(video_path):
        # Periksa ukuran file
        file_size = os.path.getsize(video_path)
        if file_size < 10000:  # Jika kurang dari 10KB, kemungkinan ada masalah
            return {
                "status": "failed",
                "progress": 100,
                "error_message": "Video dihasilkan tetapi ukurannya terlalu kecil",
                "log": [
                    f"Video berhasil dibuat tapi ukurannya hanya {file_size} byte",
                    f"ID Video: {video_id}"
                ]
            }
            
        # File ada dan ukurannya cukup, kembalikan completed
        server_url = "http://localhost:8000"  # Ganti sesuai kebutuhan
        video_url = f"{server_url}/static/videos/{video_filename}"
        return {
            "status": "completed",
            "progress": 100,
            "video_url": video_url,
            "log": [
                "Video berhasil dibuat",
                f"ID Video: {video_id}",
                f"Ukuran: {file_size/1024:.2f} KB"
            ]
        }
    
    # Jika tidak, kembalikan status processing
    return {
        "status": "processing",
        "progress": 30,
        "log": [
            "Menyiapkan data slides dan opsi TTS",
            "Menghasilkan audio narasi",
            "Mengolah gambar",
            f"ID Video: {video_id}"
        ]
    } 