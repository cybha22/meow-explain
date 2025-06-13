import requests
import json
import time
import base64
import os
from datetime import datetime

# URL API
BASE_URL = "http://localhost:8000"

def test_get_voices():
    """
    Test endpoint untuk mendapatkan daftar suara yang tersedia
    """
    response = requests.get(f"{BASE_URL}/api/videos/voices")
    print("Status Code:", response.status_code)
    print("Response:", json.dumps(response.json(), indent=2))
    return response.json()

def test_generate_video(image_paths=None):
    """
    Test endpoint untuk menghasilkan video
    
    Args:
        image_paths: List path file gambar untuk digunakan
    """
    # Jika tidak ada image_paths, gunakan URL default
    if not image_paths:
        # Gunakan URL gambar dari internet
        slides = [
            {
                "text": "Ini adalah contoh teks untuk slide pertama dengan kucing kecil yang lucu",
                "image_url": "https://placekitten.com/600/400",
                "duration": 5.0
            },
            {
                "text": "Kucing kecil bermain-main dengan benang wol yang berwarna-warni",
                "image_url": "https://placekitten.com/600/401",
                "duration": 5.0
            },
            {
                "text": "Mereka sangat menyukai tempat-tempat yang hangat dan nyaman untuk tidur",
                "image_url": "https://placekitten.com/600/402",
                "duration": 5.0
            }
        ]
    else:
        # Gunakan file gambar lokal (convert ke base64)
        slides = []
        for i, image_path in enumerate(image_paths):
            # Baca file gambar
            with open(image_path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
            
            # Tambahkan ke slides
            slides.append({
                "text": f"Ini adalah contoh teks untuk slide {i+1}",
                "image_url": f"data:image/jpeg;base64,{encoded_string}",
                "duration": 5.0
            })
    
    # Buat request body
    request_body = {
        "slides": slides,
        "tts_options": {
            "language": "id",
            "voice": "id-ID-Standard-A",
            "rate": 1.0,
            "pitch": 1.0,
            "volume": 1.0
        },
        "output_filename": f"test-video-{datetime.now().strftime('%Y%m%d%H%M%S')}.mp4",
        "min_duration": 35.0
    }
    
    # Kirim request
    print("Sending request to generate video...")
    response = requests.post(
        f"{BASE_URL}/api/videos/generate",
        json=request_body
    )
    
    print("Status Code:", response.status_code)
    print("Response:", json.dumps(response.json(), indent=2))
    
    # Jika video sedang diproses di background, check status
    result = response.json()
    if result.get("success") and "status" in result.get("video_url", ""):
        video_id = result["video_url"].split("/")[-1]
        check_video_status(video_id)
    
    return result

def check_video_status(video_id):
    """
    Check status pembuatan video
    
    Args:
        video_id: ID video yang sedang diproses
    """
    print(f"Checking status for video {video_id}...")
    
    # Poll status hingga selesai
    max_attempts = 30
    attempts = 0
    
    while attempts < max_attempts:
        response = requests.get(f"{BASE_URL}/api/videos/status/{video_id}")
        status = response.json()
        
        print(f"Status: {json.dumps(status, indent=2)}")
        
        if status.get("status") == "completed":
            print(f"Video ready at: {status.get('video_url')}")
            break
        
        print(f"Video still processing. Waiting 5 seconds... (Attempt {attempts+1}/{max_attempts})")
        time.sleep(5)
        attempts += 1
    
    if attempts >= max_attempts:
        print("Timed out waiting for video to complete.")

if __name__ == "__main__":
    # Test mendapatkan daftar suara
    print("===== Testing Get Voices API =====")
    test_get_voices()
    
    print("\n===== Testing Generate Video API =====")
    # Test generate video dengan URL gambar
    test_generate_video()
    
    # Uncomment untuk test dengan file gambar lokal
    # image_paths = ["path/to/image1.jpg", "path/to/image2.jpg", "path/to/image3.jpg"]
    # test_generate_video(image_paths) 