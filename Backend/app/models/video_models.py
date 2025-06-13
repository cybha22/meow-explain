from pydantic import BaseModel
from typing import List, Optional

class SlideData(BaseModel):
    """Model untuk data slide yang akan dikonversi ke video"""
    text: str
    image_url: str
    duration: Optional[float] = 3.0  # Durasi default 3 detik per slide

class TTSOptions(BaseModel):
    """Model untuk pengaturan Text-to-Speech"""
    language: str = "id"  # Default: Bahasa Indonesia
    voice: str = "id-ID-Standard-A"  # Default: Suara standard Indonesia
    rate: float = 1.0  # Kecepatan bicara: 1.0 adalah normal
    pitch: float = 1.0  # Pitch suara: 1.0 adalah normal
    volume: float = 1.0  # Volume: 1.0 adalah 100%

class VideoGenerationRequest(BaseModel):
    """Model untuk request pembuatan video"""
    slides: List[SlideData]
    tts_options: TTSOptions
    output_filename: Optional[str] = None
    min_duration: Optional[float] = 35.0  # Minimal durasi 35 detik
    strict_sync: Optional[bool] = True  # Flag untuk sinkronisasi audio-video ketat

class VideoGenerationResponse(BaseModel):
    """Model untuk response dari proses generate video"""
    success: bool
    video_id: str
    video_url: str
    duration: Optional[float] = None
    error_message: Optional[str] = None

class TTSVoiceOption(BaseModel):
    """Model untuk opsi suara TTS yang tersedia"""
    voice_id: str
    name: str
    language: str
    gender: str = "female"  # Default: female

class AvailableVoicesResponse(BaseModel):
    """Model untuk response daftar suara yang tersedia"""
    voices: List[TTSVoiceOption] 