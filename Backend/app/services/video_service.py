import os
import uuid
import tempfile
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from PIL import Image, ImageDraw, ImageFont
from moviepy.editor import (
    ImageClip, TextClip, CompositeVideoClip, AudioFileClip, 
    concatenate_videoclips, concatenate_audioclips, ColorClip
)

from app.models.video_models import SlideData, TTSOptions, VideoGenerationRequest
from app.services.tts_service import TTSService

class VideoService:
    """Service untuk membuat video dari slide dan audio"""
    
    def __init__(
        self, 
        output_dir: str = "static/videos",
        temp_dir: str = "static/temp",
        font_path: str = None
    ):
        """
        Inisialisasi Video Service
        
        Args:
            output_dir: Direktori untuk menyimpan file video yang dihasilkan
            temp_dir: Direktori untuk file sementara
            font_path: Path ke font yang akan digunakan untuk subtitle
        """
        self.output_dir = output_dir
        self.temp_dir = temp_dir
        self.font_path = font_path
        self.tts_service = TTSService()
        
        # Buat direktori jika belum ada
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        Path(temp_dir).mkdir(parents=True, exist_ok=True)
    
    def _download_image(self, image_url: str) -> str:
        """
        Mengunduh gambar atau menyalin dari path lokal
        
        Args:
            image_url: URL atau path ke gambar
            
        Returns:
            str: Path lokal ke gambar
        """
        # Jika sudah path lokal, gunakan langsung
        if os.path.exists(image_url):
            return image_url
            
        # Untuk data URL (base64), simpan ke file
        if image_url.startswith("data:image"):
            import base64
            # Extract content type and base64 data
            header, encoded = image_url.split(",", 1)
            content_type = header.split(":")[1].split(";")[0]
            ext = content_type.split("/")[1]  # jpg, png, etc.
            
            # Simpan sebagai file
            temp_path = os.path.join(self.temp_dir, f"{uuid.uuid4()}.{ext}")
            with open(temp_path, "wb") as f:
                f.write(base64.b64decode(encoded))
            return temp_path
            
        # Untuk URL, unduh
        import requests
        temp_path = os.path.join(self.temp_dir, f"{uuid.uuid4()}.jpg")
        response = requests.get(image_url, stream=True)
        if response.status_code == 200:
            with open(temp_path, "wb") as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            return temp_path
        else:
            raise Exception(f"Gagal mengunduh gambar dari {image_url}")
    
    def _create_subtitle_clip(
        self, 
        text: str, 
        size: Tuple[int, int], 
        duration: float
    ) -> TextClip:
        """
        Membuat clip subtitle
        
        Args:
            text: Teks subtitle
            size: Ukuran video (width, height)
            duration: Durasi clip
            
        Returns:
            TextClip: Clip subtitle
        """
        # Buat TextClip untuk subtitle
        subtitle = TextClip(
            text, 
            font='Arial' if not self.font_path else self.font_path,
            fontsize=24, 
            color='white',
            bg_color='rgba(0,0,0,0.5)',
            size=(size[0] * 0.8, None),  # 80% lebar video, tinggi otomatis
            method='caption'
        )
        
        # Posisikan di bagian bawah video
        subtitle = subtitle.set_position(('center', 0.8 * size[1]))
        subtitle = subtitle.set_duration(duration)
        
        return subtitle
    
    def generate_video(self, request: VideoGenerationRequest) -> Dict:
        """
        Menghasilkan video dari slide dan audio
        
        Args:
            request: Request pembuatan video
            
        Returns:
            Dict: Informasi video yang dihasilkan
        """
        try:
            # Gunakan implementasi yang lebih sederhana dan stabil
            return self.generate_video_v2(request)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error_message": str(e)
            }
            
    def generate_video_v2(self, request: VideoGenerationRequest) -> Dict:
        """
        Menghasilkan video dari slide dan audio dengan metode V2 yang lebih sederhana
        
        Args:
            request: Request pembuatan video
            
        Returns:
            Dict: Informasi video yang dihasilkan
        """
        try:
            # Import yang diperlukan dari moviepy
            from moviepy.editor import ImageClip, TextClip, CompositeVideoClip, AudioFileClip
            from moviepy.editor import concatenate_videoclips, concatenate_audioclips, ColorClip
            
            # Buat nama file output
            output_filename = request.output_filename or f"{uuid.uuid4()}.mp4"
            output_path = os.path.join(self.output_dir, output_filename)
            
            # Periksa flag sinkronisasi ketat
            strict_sync = getattr(request, 'strict_sync', True)
            print(f"Mode sinkronisasi ketat V2: {'AKTIF' if strict_sync else 'NONAKTIF'}")
            
            # Tampilkan informasi rate
            speech_rate = request.tts_options.rate
            print(f"Kecepatan bicara: {speech_rate}x")
            
            # Padding audio lebih pendek (0.5 detik) untuk mengurangi jeda antar slide
            audio_padding = 0.5
            
            # Ukuran video (9:16 ratio untuk shorts/Tiktok)
            video_size = (1080, 1920)
            
            # List untuk menyimpan clips
            video_clips = []
            audio_clips = []
            total_duration = 0
            audio_durations = []  # Untuk log
            
            # Buat clip untuk setiap slide
            for idx, slide in enumerate(request.slides):
                print(f"Memproses slide {idx+1}/{len(request.slides)}")
                
                # Hasilkan audio untuk slide terlebih dahulu
                audio_path = self.tts_service.generate_audio(slide.text, request.tts_options)
                audio_clip = AudioFileClip(audio_path)
                audio_duration = audio_clip.duration
                audio_durations.append(audio_duration)
                
                # Tambahkan margin keamanan untuk audio
                safety_margin = 0.1
                
                # Hitung durasi slide = durasi audio + padding
                slide_duration = audio_duration + audio_padding + safety_margin
                if slide.duration > slide_duration:
                    slide_duration = slide.duration
                
                print(f"Slide {idx+1}: text='{slide.text[:30]}...', audio={audio_duration:.2f}s, duration={slide_duration:.2f}s")
                
                # Buat image clip
                image_path = self._download_image(slide.image_url)
                image = ImageClip(image_path)
                
                # Resize dan posisikan gambar
                try:
                    image = image.resize(height=video_size[1] * 0.6)
                    if image.w > video_size[0]:
                        image = image.resize(width=video_size[0])
                except Exception as e:
                    print(f"Error resizing image: {e}")
                
                image = image.set_position('center')
                image = image.set_duration(slide_duration)
                
                # Buat subtitle
                subtitle = self._create_subtitle_clip(slide.text, video_size, slide_duration)
                
                # Buat clip tunggal untuk slide ini dengan background hitam
                bg = ColorClip(size=video_size, color=(0, 0, 0)).set_duration(slide_duration)
                slide_clip = CompositeVideoClip([bg, image, subtitle], size=video_size)
                
                # Tambahkan audio ke slide ini
                # PERBAIKAN: Pastikan audio tidak mencoba memutar melebihi durasi sebenarnya
                # Tambah margin sekitar 0.05 detik dari akhir untuk mencegah error out of bounds
                safe_audio_duration = min(audio_duration, slide_duration - 0.05)
                print(f"Audio asli: {audio_duration:.2f}s, Durasi aman: {safe_audio_duration:.2f}s")
                
                # Gunakan subclip untuk memotong audio yang terlalu panjang
                trimmed_audio = audio_clip.subclip(0, safe_audio_duration)
                slide_clip = slide_clip.set_audio(trimmed_audio)
                
                # Tambahkan audio asli ke audio_clips untuk fallback method
                audio_clips.append(audio_clip)
                
                # Tambahkan ke daftar clips
                video_clips.append(slide_clip)
                total_duration += slide_duration
            
            # Periksa durasi minimum
            if total_duration < request.min_duration:
                # Perpanjang clip terakhir jika perlu
                extra_duration = request.min_duration - total_duration
                last_clip = video_clips[-1]
                video_clips[-1] = last_clip.set_duration(last_clip.duration + extra_duration)
                total_duration = request.min_duration
            
            print(f"Total clips: {len(video_clips)}, Total duration: {total_duration:.2f}s")
            
            # Gabungkan video clip dengan method compose yang sederhana
            print("Menggabungkan video clips...")
            try:
                final_clip = concatenate_videoclips(video_clips, method="compose")
                
                print(f"Final video duration: {final_clip.duration:.2f}s")
                print(f"Audio durations: {audio_durations}")
                
                # Export video dengan pengaturan sederhana
                print(f"Exporting video to {output_path}...")
                final_clip.write_videofile(
                    output_path, 
                    fps=24,
                    codec="libx264", 
                    audio_codec="aac",
                    bitrate="2000k",
                    preset="ultrafast",
                    threads=2,
                    ffmpeg_params=["-vf", "format=yuv420p"],
                    logger=None  # Suppress logs untuk mengurangi noise
                )
            except Exception as e:
                print(f"Error exporting video: {str(e)}")
                print(f"Mencoba metode alternatif dengan audio...")
                
                # Coba metode alternatif lain yang masih menyertakan audio
                try:
                    # Menggunakan metode yang berbeda tapi tetap dengan audio
                    print("Metode 1: concatenate dengan method lain")
                    final_clip = concatenate_videoclips(video_clips, method="chain")
                    final_clip.write_videofile(
                        output_path, 
                        fps=24,
                        codec="libx264",
                        audio_codec="aac",
                        bitrate="2000k",
                        preset="ultrafast",
                        threads=2,
                        ffmpeg_params=["-vf", "format=yuv420p"],
                        logger=None
                    )
                except Exception as e2:
                    print(f"Metode 1 gagal: {str(e2)}")
                    print("Mencoba metode 2: gabung slide satu per satu dengan audio terpisah")
                    
                    try:
                        # Metode 2: Gabung video satu per satu dengan audio terpisah
                        from moviepy.editor import CompositeVideoClip, AudioFileClip
                        
                        # Background hitam untuk seluruh durasi
                        bg_clip = ColorClip(size=video_size, color=(0, 0, 0)).set_duration(total_duration)
                        
                        # Audio clips yang akan digabungkan
                        all_audio_clips = []
                        current_start = 0
                        
                        # Set start time dari setiap slide
                        positioned_clips = []
                        for idx, clip in enumerate(video_clips):
                            # Set posisi waktu untuk setiap slide
                            clip_duration = clip.duration
                            positioned_clip = clip.set_start(current_start)
                            positioned_clips.append(positioned_clip)
                            
                            # Tambahkan audio clip dengan posisi sesuai
                            if idx < len(audio_clips):
                                audio = audio_clips[idx]
                                audio = audio.set_start(current_start)
                                all_audio_clips.append(audio)
                            
                            # Increment start time
                            current_start += clip_duration
                        
                        # Gabung semua clips
                        final_clip = CompositeVideoClip([bg_clip] + positioned_clips, size=video_size)
                        
                        # Gabung semua audio clips
                        from moviepy.editor import CompositeAudioClip
                        final_audio = CompositeAudioClip(all_audio_clips)
                        
                        # Set audio ke video
                        final_clip = final_clip.set_audio(final_audio)
                        
                        # Export with audio
                        final_clip.write_videofile(
                            output_path, 
                            fps=24, 
                            codec="libx264",
                            audio_codec="aac",
                            bitrate="2000k",
                            preset="ultrafast",
                            threads=2,
                            ffmpeg_params=["-vf", "format=yuv420p"],
                            logger=None
                        )
                    except Exception as e3:
                        print(f"Metode 2 gagal: {str(e3)}")
                        raise e3
            
            # Return info dengan URL lengkap
            server_url = "http://localhost:8000"
            return {
                "success": True,
                "video_url": f"{server_url}/static/videos/{output_filename}",
                "duration": total_duration
            }
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error_message": str(e)
            } 