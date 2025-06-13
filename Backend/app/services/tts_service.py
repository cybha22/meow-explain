import os
import uuid
import pyttsx3
from gtts import gTTS
from pathlib import Path
from typing import Dict, List, Optional
import tempfile
from pydub import AudioSegment

from app.models.video_models import TTSOptions, TTSVoiceOption

# Daftar suara yang tersedia
AVAILABLE_VOICES = {
    # Suara bahasa Indonesia
    "id-ID-Standard-A": {"name": "Wanita Indonesia", "language": "id", "gender": "female"},
    "id-ID-Standard-B": {"name": "Pria Indonesia", "language": "id", "gender": "male"},
    
    # Suara bahasa Inggris (US)
    "en-US-Standard-A": {"name": "Wanita Amerika", "language": "en", "gender": "female"},
    "en-US-Standard-B": {"name": "Pria Amerika", "language": "en", "gender": "male"},
    "en-US-Standard-C": {"name": "Wanita Amerika 2", "language": "en", "gender": "female"},
    "en-US-Standard-D": {"name": "Pria Amerika 2", "language": "en", "gender": "male"},
    
    # Suara bahasa Inggris (UK)
    "en-GB-Standard-A": {"name": "Wanita Inggris", "language": "en-GB", "gender": "female"},
    "en-GB-Standard-B": {"name": "Pria Inggris", "language": "en-GB", "gender": "male"},
}

class TTSService:
    """Service untuk menghasilkan audio dari teks menggunakan TTS"""
    
    def __init__(self, output_dir: str = "static/audio"):
        """
        Inisialisasi TTS Service
        
        Args:
            output_dir: Direktori untuk menyimpan file audio yang dihasilkan
        """
        self.output_dir = output_dir
        self._ensure_output_dir_exists()
    
    def _ensure_output_dir_exists(self):
        """Memastikan direktori output ada"""
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)
    
    def get_available_voices(self) -> List[TTSVoiceOption]:
        """
        Mendapatkan daftar suara yang tersedia
        
        Returns:
            List[TTSVoiceOption]: Daftar suara yang tersedia
        """
        voices = []
        for voice_id, voice_data in AVAILABLE_VOICES.items():
            voices.append(
                TTSVoiceOption(
                    voice_id=voice_id,
                    name=voice_data["name"],
                    language=voice_data["language"],
                    gender=voice_data["gender"]
                )
            )
        return voices
    
    def generate_audio(self, text: str, options: TTSOptions) -> str:
        """
        Menghasilkan audio dari teks
        
        Args:
            text: Teks yang akan diubah menjadi audio
            options: Opsi TTS
            
        Returns:
            str: Path ke file audio yang dihasilkan
        """
        # Buat nama file unik
        filename = f"{uuid.uuid4()}.mp3"
        output_path = os.path.join(self.output_dir, filename)
        
        try:
            # Gunakan gTTS untuk bahasa yang didukung
            if options.language in ["id", "en", "en-GB"]:
                # Mapping untuk gTTS
                lang_map = {
                    "id": "id",
                    "en": "en",
                    "en-GB": "en-uk"
                }
                
                # Gunakan gTTS
                tts = gTTS(
                    text=text,
                    lang=lang_map.get(options.language, "id"),
                    slow=False  # Selalu gunakan normal speed, kita akan mengatur kecepatan sendiri
                )
                tts.save(output_path)
                
                # Terapkan kecepatan yang diminta
                if options.rate != 1.0:
                    output_path = self._adjust_audio_speed(output_path, options.rate)
            else:
                # Gunakan pyttsx3 untuk bahasa lain atau fallback
                engine = pyttsx3.init()
                
                # Set properties
                engine.setProperty('rate', int(options.rate * 200))  # Default rate adalah 200
                engine.setProperty('volume', options.volume)
                
                # Coba set voice berdasarkan gender
                voices = engine.getProperty('voices')
                for voice in voices:
                    if options.language in voice.id:
                        engine.setProperty('voice', voice.id)
                        break
                
                # Simpan audio
                engine.save_to_file(text, output_path)
                engine.runAndWait()
                
            return output_path
        except Exception as e:
            # Jika gagal, gunakan pyttsx3 sebagai fallback
            try:
                engine = pyttsx3.init()
                engine.setProperty('rate', int(options.rate * 200))
                engine.setProperty('volume', options.volume)
                engine.save_to_file(text, output_path)
                engine.runAndWait()
                return output_path
            except Exception as inner_e:
                raise Exception(f"Gagal menghasilkan audio: {str(e)}. Fallback error: {str(inner_e)}")
                
    def estimate_audio_duration(self, text: str, options: TTSOptions) -> float:
        """
        Memperkirakan durasi audio dari teks
        
        Args:
            text: Teks yang akan diperkirakan durasinya
            options: Opsi TTS
            
        Returns:
            float: Perkiraan durasi dalam detik
        """
        # Kecepatan rata-rata bicara adalah 150 kata per menit atau 2.5 kata per detik
        words = text.split()
        word_count = len(words)
        
        # Faktor rate akan mempengaruhi durasi
        duration = word_count / (2.5 * options.rate)
        
        # Durasi minimal 1 detik
        return max(duration, 1.0)

    def _adjust_audio_speed(self, audio_path: str, rate: float) -> str:
        """
        Mengubah kecepatan audio menggunakan pydub
        
        Args:
            audio_path: Path audio yang akan diubah
            rate: Kecepatan baru (1.0 = normal)
            
        Returns:
            str: Path audio yang telah diubah
        """
        # Jika rate = 1.0, tidak perlu diubah
        if rate == 1.0:
            return audio_path
            
        try:
            # Load audio
            sound = AudioSegment.from_mp3(audio_path)
            
            # Hitung speed factor (pitch dipertahankan)
            # Untuk pydub, speed factor < 1.0 membuat audio lebih cepat
            # Sedangkan kita menggunakan rate > 1.0 untuk lebih cepat
            # Jadi rumusnya adalah 1.0 / rate
            speed_factor = 1.0 / rate
            
            print(f"Adjusting audio speed with rate={rate}, speed_factor={speed_factor}")
            
            # Ubah kecepatan dengan mempertahankan pitch
            # Gunakan temporary file
            temp_file = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
            temp_path = temp_file.name
            temp_file.close()
            
            # Export dengan efek tempo (mengubah kecepatan tanpa mengubah pitch)
            sound.export(
                temp_path,
                format="mp3",
                parameters=["-filter:a", f"atempo={rate}"]
            )
            
            # Ganti file lama dengan yang baru
            os.replace(temp_path, audio_path)
            
            return audio_path
            
        except Exception as e:
            print(f"Error adjusting audio speed: {str(e)}")
            # Jika gagal, kembalikan audio asli
            return audio_path 