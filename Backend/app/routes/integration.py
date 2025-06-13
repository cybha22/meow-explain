from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import List, Optional
import json
import base64
import os
from pathlib import Path

from app.models.video_models import (
    SlideData,
    TTSOptions,
    VideoGenerationRequest,
    VideoGenerationResponse
)
from app.services.video_service import VideoService

router = APIRouter(
    prefix="/api/integration",
    tags=["integration"],
)

# Inisialisasi service
video_service = VideoService()

@router.post("/generate-from-slides", response_model=VideoGenerationResponse)
async def generate_video_from_frontend_slides(
    request: Request
):
    """
    Endpoint untuk integrasi dengan frontend Tiny Cats.
    Menghasilkan video dari data slide yang sudah ada di frontend.
    
    Frontend harus mengirimkan data dalam format:
    {
        "slides": [
            {
                "text": "Teks slide",
                "image": "data:image/jpeg;base64,..." (base64 encoded image)
            }
        ],
        "tts_options": {
            "language": "id",
            "voice": "id-ID-Standard-A",
            "rate": 1.0,
            "pitch": 1.0,
            "volume": 1.0
        }
    }
    """
    try:
        # Parse request JSON
        data = await request.json()
        
        # Validasi data
        if not data.get("slides"):
            raise HTTPException(status_code=400, detail="Tidak ada data slide")
        
        # Konversi format data
        slides = []
        for slide_data in data.get("slides"):
            # Ambil teks dan gambar
            text = slide_data.get("text", "")
            image = slide_data.get("image", "")
            
            # Tambahkan ke slides
            slides.append(
                SlideData(
                    text=text,
                    image_url=image,
                    duration=5.0  # Default durasi
                )
            )
        
        # Ambil opsi TTS
        tts_options_data = data.get("tts_options", {})
        tts_options = TTSOptions(
            language=tts_options_data.get("language", "id"),
            voice=tts_options_data.get("voice", "id-ID-Standard-A"),
            rate=float(tts_options_data.get("rate", 1.0)),
            pitch=float(tts_options_data.get("pitch", 1.0)),
            volume=float(tts_options_data.get("volume", 1.0))
        )
        
        # Buat request untuk pembuatan video
        video_request = VideoGenerationRequest(
            slides=slides,
            tts_options=tts_options,
            min_duration=35.0  # Minimal 35 detik
        )
        
        # Hasilkan video
        result = video_service.generate_video(video_request)
        
        if result["success"]:
            return VideoGenerationResponse(
                success=True,
                video_url=result["video_url"],
                duration=result["duration"]
            )
        else:
            raise HTTPException(status_code=500, detail=result["error_message"])
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """
    Endpoint untuk upload gambar.
    Menerima file gambar dan menyimpannya di server, kemudian mengembalikan URL.
    """
    try:
        # Buat direktori jika belum ada
        upload_dir = Path("static/uploads")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Simpan file
        file_extension = os.path.splitext(file.filename)[1]
        file_name = f"{os.urandom(8).hex()}{file_extension}"
        file_path = upload_dir / file_name
        
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        # Return URL
        return {
            "success": True,
            "url": f"/static/uploads/{file_name}"
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        } 