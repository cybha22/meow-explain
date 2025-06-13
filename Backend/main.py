import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.routes import video_routes, integration

app = FastAPI(
    title="Tiny Cats Video Generator API",
    description="API untuk membuat video shorts dengan TTS dan subtitle otomatis",
    version="1.0.0",
)

# Tambahkan CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Izinkan semua origin (dalam produksi, batasi ini)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Tambahkan routes
app.include_router(video_routes.router)
app.include_router(integration.router)

# Siapkan direktori static
os.makedirs("static/videos", exist_ok=True)
os.makedirs("static/audio", exist_ok=True)
os.makedirs("static/temp", exist_ok=True)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True) 