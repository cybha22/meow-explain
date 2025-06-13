# Meow Explain

Meow Explain is a web application that transforms complex topics into fun and engaging slideshows featuring cute cat illustrations, complete with voice narration and exportable as short videos. Perfect for education, entertainment, and sharing knowledge on social media like YouTube Shorts, Instagram Reels, and Facebook!

## Main Features
- **Input Prompt:** Enter a question or topic, Meow Explain will break it down using small cat analogies.
- **Slideshow Illustration:** Each explanation is split into slides with minimalist cat images.
- **Image Editor:** Edit each slide's image directly in the browser.
- **Video Generator:** Combine slides and TTS (Text-to-Speech) narration into an automatic video.
- **Download & Share:** Download the video or share it instantly.
- **Multi-Language:** Narration language options (Indonesian, English, Japanese, Korean).
- **Automatic API:** FastAPI backend provides endpoints for integration and automation.

## Local Demo
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend & API:** [http://localhost:8000](http://localhost:8000)
- **API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

## Installation
### Requirements
- Node.js (latest version recommended)
- Python 3.10+
- FFmpeg (make sure it's in the PATH)
- pip (Python package manager)

### Quick Start (Windows PowerShell)
```powershell
git clone https://github.com/cybha22/meow-explain.git
cd meow-explain
npm install
npm run install:backend
```

### Running the Application
#### Run Backend & Frontend Together (Recommended)
You can start both backend and frontend at once using:
```bash
npm run dev
```
- This command will launch the backend (FastAPI) and the frontend (Vite) concurrently.
- After running, open [http://localhost:5173](http://localhost:5173) in your browser.

#### Windows (PowerShell)
```powershell
.\run-app.ps1
```
#### Windows (CMD)
```cmd
run-app.bat
```
#### Linux/Mac
```bash
bash run-app.sh
```
#### Manual
1. Activate Python virtual environment:
    - Windows: `Backend\venv\Scripts\activate`
    - Linux/Mac: `source Backend/venv/bin/activate`
2. Run backend:
    ```bash
    cd Backend
    uvicorn main:app --reload --host 127.0.0.1 --port 8000
    ```
3. Run frontend:
    ```bash
    npm run start:frontend
    ```

## Project Structure
```text
tiny-cats/
│
├── Backend/           # FastAPI backend (API, video, TTS)
│   ├── app/
│   ├── static/
│   ├── requirements.txt
│   └── main.py
│
├── index.html         # Main frontend (Vite + TS/JS)
├── index.tsx          # Main frontend logic
├── index.css          # Styling
├── package.json       # npm scripts & dependencies
├── run-app.ps1        # PowerShell all-in-one script
├── run-app.bat        # Windows batch script
├── run-app.sh         # Linux/Mac bash script
└── ...
```

## Main API Endpoints
- `POST /api/videos/generate`  
  Generate a video from an array of slides + TTS options.
- `GET /api/videos/voices`  
  List available TTS voices.
- `GET /api/videos/status/{video_id}`  
  Check video generation status.
- `POST /api/integration/generate-from-slides`  
  Frontend-backend integration endpoint.
- `POST /api/integration/upload-image`  
  Upload an image to the server.

Full documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

## Dependencies
### Backend (Python)
- fastapi
- uvicorn
- python-multipart
- moviepy
- gTTS
- pydantic
- python-dotenv
- aiofiles
- pyttsx3

### Frontend (Node.js)
- @google/genai
- marked
- vite
- concurrently
- typescript

## Contribution
Pull requests, issues, and suggestions are very welcome!
Please ensure the code is clean and easy to understand, and use English for documentation.

## License
MIT
