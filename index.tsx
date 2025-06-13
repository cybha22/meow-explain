/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI, Modality} from '@google/genai';
import {marked} from 'marked';

// Konfigurasi API key
const apiKey = 'AIzaSyAVr8a4i3fxBejHIQ61BK52axFQq1GIQEo';

// Inisialisasi Google Genai dengan API key
const ai = new GoogleGenAI({
  apiKey: apiKey,
});

const chat = ai.chats.create({
  model: 'gemini-2.0-flash-preview-image-generation',
  config: {
    responseModalities: [Modality.TEXT, Modality.IMAGE],
  },
  history: [],
});

const userInput = document.querySelector('#input') as HTMLTextAreaElement;
const modelOutput = document.querySelector('#output') as HTMLDivElement;
const slideshow = document.querySelector('#slideshow') as HTMLDivElement;
const error = document.querySelector('#error') as HTMLDivElement;
const submitBtn = document.querySelector('#submit-btn') as HTMLButtonElement;

// Video Generator Elements
const videoGenerator = document.querySelector('#video-generator') as HTMLDivElement;
const languageSelect = document.querySelector('#language-select') as HTMLSelectElement;
const voiceSelect = document.querySelector('#voice-select') as HTMLSelectElement;
const speedRange = document.querySelector('#speed-range') as HTMLInputElement;
const speedValue = document.querySelector('#speed-value') as HTMLSpanElement;
const minDuration = document.querySelector('#min-duration') as HTMLInputElement;
const generateVideoBtn = document.querySelector('#generate-video-btn') as HTMLButtonElement;
const videoProgress = document.querySelector('#video-progress') as HTMLDivElement;
const statusText = document.querySelector('#status-text') as HTMLSpanElement;
const progressBar = document.querySelector('#progress-bar') as HTMLDivElement;
const progressLog = document.querySelector('#progress-log') as HTMLDivElement;
const videoResult = document.querySelector('#video-result') as HTMLDivElement;
const resultVideo = document.querySelector('#result-video') as HTMLVideoElement;
const downloadLink = document.querySelector('#download-link') as HTMLAnchorElement;
const shareBtn = document.querySelector('#share-btn') as HTMLButtonElement;

// Modal Elements
const editTextModal = document.getElementById('edit-text-modal') as HTMLDivElement;
const editTextInput = document.getElementById('edit-text-input') as HTMLTextAreaElement;
const modalClose = document.getElementById('modal-close') as HTMLButtonElement;
const modalCancel = document.getElementById('modal-cancel') as HTMLButtonElement;
const modalSave = document.getElementById('modal-save') as HTMLButtonElement;
let currentEditSlide: HTMLElement | null = null;

// Drawing Editor Elements
const drawEditorModal = document.getElementById('draw-editor-modal') as HTMLDivElement;
const drawingCanvas = document.getElementById('drawing-canvas') as HTMLCanvasElement;
const ctx = drawingCanvas.getContext('2d') as CanvasRenderingContext2D;
const colorPicker = document.getElementById('color-picker') as HTMLDivElement;
const sizeSlider = document.getElementById('size-slider') as HTMLInputElement;
const sizeValue = document.getElementById('size-value') as HTMLSpanElement;
const brushTool = document.getElementById('brush-tool') as HTMLButtonElement;
const eraserTool = document.getElementById('eraser-tool') as HTMLButtonElement;
const undoBtn = document.getElementById('undo-btn') as HTMLButtonElement;
const redoBtn = document.getElementById('redo-btn') as HTMLButtonElement;
const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
const drawingClose = document.getElementById('drawing-close') as HTMLButtonElement;
const cancelDrawing = document.getElementById('cancel-drawing') as HTMLButtonElement;
const saveDrawing = document.getElementById('save-drawing') as HTMLButtonElement;

// Drawing state variables
let currentColor = '#000000';
let currentSize = 5;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentTool = 'brush';
const history: ImageData[] = [];
const redoStack: ImageData[] = [];
let historyIndex = -1;
let currentImage: HTMLImageElement | null = null;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI interaction effects
  addUISmoothEffects();
  
  // Add event listener for submit button
  submitBtn.addEventListener('click', async () => {
    await handleSubmit();
  });
  
  // Add event for Enter key in textarea
  userInput.addEventListener('keydown', async (e: KeyboardEvent) => {
    if (e.code === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await handleSubmit();
    }
  });
  
  // Initialize examples
  const examples = document.querySelectorAll('#examples li');
  examples.forEach((li) =>
    li.addEventListener('click', async (e) => {
      const card = li.querySelector('.example-card');
      if (card) {
        await generate(card.textContent || '');
      }
    }),
  );

  // Setup Video Generator
  setupVideoGenerator();
  
  // Setup Modal events
  setupModalEvents();
  
  // Setup Drawing Editor
  setupDrawingEditor();
});

const additionalInstructions = `
Use a fun story about lots of tiny cats as a metaphor.
Keep sentences short but conversational, casual, and engaging.
Generate a cute, minimal illustration for each sentence with black ink on white background.
No commentary, just begin your explanation.
Keep going until you're done.`;

function addUISmoothEffects() {
  // Input container focus effect
  const inputContainer = document.querySelector('.input-container') as HTMLDivElement;
  if (inputContainer) {
    userInput.addEventListener('focus', () => {
      inputContainer.classList.add('focused');
    });
    
    userInput.addEventListener('blur', () => {
      inputContainer.classList.remove('focused');
    });
  }
  
  // Auto-resize textarea
  userInput.addEventListener('input', autoResizeTextarea);
  
  // Add drag-to-scroll functionality for slideshow
  enableDragToScroll();
}

function autoResizeTextarea() {
  userInput.style.height = 'auto';
  userInput.style.height = (userInput.scrollHeight) + 'px';
}

async function addSlide(text: string, image: HTMLImageElement) {
  const slide = document.createElement('div');
  slide.className = 'slide';
  slide.dataset.included = 'true'; // Flag untuk pengambilan slide saat generate video
  
  // Tambahkan div control untuk tombol edit dan hapus
  const controls = document.createElement('div');
  controls.className = 'slide-controls';
  
  // Tombol Edit
  const editBtn = document.createElement('button');
  editBtn.className = 'slide-edit-btn';
  editBtn.innerHTML = '✏️';
  editBtn.title = 'Edit teks';
  editBtn.addEventListener('click', () => openEditModal(slide));
  
  // Tombol Edit Gambar
  const drawBtn = document.createElement('button');
  drawBtn.className = 'slide-edit-btn';
  drawBtn.innerHTML = '🎨';
  drawBtn.title = 'Edit gambar';
  drawBtn.addEventListener('click', () => openDrawingEditor(slide, image));
  
  // Tombol Delete
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'slide-delete-btn';
  deleteBtn.innerHTML = '❌';
  deleteBtn.title = 'Hapus gambar dari video';
  deleteBtn.addEventListener('click', () => toggleSlideDelete(slide));
  
  // Tambahkan tombol ke controls
  controls.appendChild(editBtn);
  controls.appendChild(drawBtn);
  controls.appendChild(deleteBtn);
  
  // Tambahkan gambar dan caption
  const caption = document.createElement('div');
  caption.innerHTML = await marked.parse(text);
  
  // Susun elemen
  slide.appendChild(controls);
  slide.appendChild(image);
  slide.appendChild(caption);
  
  // Tambahkan ke slideshow
  slideshow.appendChild(slide);
}

// Fungsi untuk membuka modal edit
function openEditModal(slide: HTMLElement) {
  const captionDiv = slide.querySelector('div:last-child');
  if (!captionDiv) return;
  
  // Ambil teks dari caption (tanpa format HTML)
  const text = captionDiv.textContent || '';
  
  // Set teks ke textarea
  editTextInput.value = text;
  
  // Simpan referensi slide yang sedang diedit
  currentEditSlide = slide;
  
  // Tampilkan modal
  editTextModal.classList.add('active');
}

// Fungsi untuk menyimpan hasil edit teks
async function saveEditedText() {
  if (!currentEditSlide) return;
  
  const captionDiv = currentEditSlide.querySelector('div:last-child');
  if (!captionDiv) return;
  
  // Update teks dengan format markdown
  const newText = editTextInput.value;
  captionDiv.innerHTML = await marked.parse(newText);
  
  // Tutup modal
  closeEditModal();
}

// Fungsi untuk menutup modal
function closeEditModal() {
  editTextModal.classList.remove('active');
  currentEditSlide = null;
}

// Fungsi untuk toggle hapus/masukkan slide
function toggleSlideDelete(slide: HTMLElement) {
  const isDeleted = slide.classList.toggle('deleted');
  slide.dataset.included = isDeleted ? 'false' : 'true';
}

// Setup event listener untuk modal
function setupModalEvents() {
  modalClose.addEventListener('click', closeEditModal);
  modalCancel.addEventListener('click', closeEditModal);
  modalSave.addEventListener('click', saveEditedText);
  
  // Close modal jika user klik di luar modal
  window.addEventListener('click', (e: MouseEvent) => {
    if (e.target === editTextModal) {
      closeEditModal();
    }
  });
}

function parseError(error: unknown): string {
  if (typeof error !== 'string') {
    return String(error);
  }
  
  try {
    // Coba parse jika error adalah JSON
    if (error.includes('{') && error.includes('}')) {
      const regex = /{"error":(.*)}/gm;
      const m = regex.exec(error);
      
      if (m && m[1]) {
        const e = m[1];
        try {
          const err = JSON.parse('{' + e + '}');
          return err.message || String(error);
        } catch {
          // Jika JSON parsing gagal, kembalikan error asli
          return String(error);
        }
      }
    }
    
    // Jika bukan JSON atau regex tidak match
    return String(error);
  } catch (e) {
    // Fallback jika semua upaya parsing gagal
    return "Unknown error occurred";
  }
}

async function handleSubmit() {
  const message = userInput.value.trim();
  if (message) {
    await generate(message);
  }
}

// Helper untuk timeout promise
function timeoutPromise(promise: Promise<any>, timeout: number): Promise<any> {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Request timed out after ${timeout}ms`)), timeout))
  ]);
}

async function generate(message: string) {
  userInput.disabled = true;
  submitBtn.disabled = true;
  
  // Show loading state
  submitBtn.classList.add('loading');
  submitBtn.innerText = 'Generating...';

  // Reset UI state
  modelOutput.innerHTML = '';
  slideshow.innerHTML = '';
  error.innerHTML = '';
  error.toggleAttribute('hidden', true);
  
  // Hide video generator and result sections
  videoGenerator.setAttribute('hidden', '');
  videoProgress.setAttribute('hidden', '');
  videoResult.setAttribute('hidden', '');

  try {
    const userTurn = document.createElement('div') as HTMLDivElement;
    userTurn.innerHTML = await marked.parse(message);
    userTurn.className = 'user-turn';
    modelOutput.append(userTurn);
    userInput.value = '';
    autoResizeTextarea();

    // Create a new chat instance for fresh history
    const newChat = ai.chats.create({
      model: 'gemini-2.0-flash-preview-image-generation',
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
      history: [],
    });

    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        // Use timeout promise to prevent hanging requests
        const result = await timeoutPromise(
          newChat.sendMessageStream({
            message: message + additionalInstructions,
          }), 
          60000 // 60 seconds timeout
        );

        let text = '';
        let img = null;
        let slideCount = 0;

        for await (const chunk of result) {
          try {
            for (const candidate of chunk.candidates || []) {
              for (const part of candidate.content?.parts ?? []) {
                if (part.text) {
                  text += part.text;
                } else {
                  try {
                    const data = part.inlineData;
                    if (data) {
                      img = document.createElement('img');
                      img.src = `data:image/png;base64,` + data.data;
                      img.loading = 'lazy';
                    } else {
                      console.log('no data in chunk');
                    }
                  } catch (e) {
                    console.log('error parsing image data:', e);
                  }
                }
                if (text && img) {
                  await addSlide(text, img);
                  slideshow.removeAttribute('hidden');
                  text = '';
                  img = null;
                  slideCount++;
                }
              }
            }
          } catch (chunkError) {
            console.error('Error processing chunk:', chunkError);
            // Continue processing other chunks
          }
        }
        
        if (img) {
          await addSlide(text, img);
          slideshow.removeAttribute('hidden');
          slideCount++;
        }
        
        // Jika tidak ada slide yang dibuat, anggap error
        if (slideCount === 0) {
          throw new Error("Tidak ada konten gambar yang dihasilkan");
        }
        
        // Auto-scroll to results
        setTimeout(() => {
          slideshow.scrollIntoView({ behavior: 'smooth', block: 'start' });
          
          // Show video generator after slides are generated
          showVideoGenerator();
        }, 300);
        
        // Jika berhasil, keluar dari loop
        break;
        
      } catch (apiError) {
        retryCount++;
        console.error(`API Error (attempt ${retryCount}/${maxRetries+1}):`, apiError);
        
        // Jika sudah mencapai max retries, lempar error
        if (retryCount > maxRetries) {
          throw apiError;
        }
        
        // Tunggu sebentar sebelum retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
  } catch (e) {
    const msg = parseError(e);
    error.innerHTML = `Something went wrong: ${msg}`;
    error.removeAttribute('hidden');
    console.error('Generation error:', e);
    
    // Scroll to error message
    setTimeout(() => {
      error.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
  
  // Reset loading state
  submitBtn.classList.remove('loading');
  submitBtn.innerText = 'Generate';
  userInput.disabled = false;
  submitBtn.disabled = false;
  userInput.focus();
}

function enableDragToScroll() {
  let isDown = false;
  let startX: number;
  let scrollLeft: number;
  
  slideshow.addEventListener('mousedown', (e) => {
    isDown = true;
    slideshow.classList.add('active');
    startX = e.pageX - slideshow.offsetLeft;
    scrollLeft = slideshow.scrollLeft;
    e.preventDefault();
  });
  
  slideshow.addEventListener('mouseleave', () => {
    isDown = false;
    slideshow.classList.remove('active');
  });
  
  slideshow.addEventListener('mouseup', () => {
    isDown = false;
    slideshow.classList.remove('active');
  });
  
  slideshow.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slideshow.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    slideshow.scrollLeft = scrollLeft - walk;
  });
  
  // Touch events for mobile
  slideshow.addEventListener('touchstart', (e) => {
    isDown = true;
    slideshow.classList.add('active');
    startX = e.touches[0].pageX - slideshow.offsetLeft;
    scrollLeft = slideshow.scrollLeft;
  }, { passive: true });
  
  slideshow.addEventListener('touchend', () => {
    isDown = false;
    slideshow.classList.remove('active');
  });
  
  slideshow.addEventListener('touchmove', (e) => {
    if (!isDown) return;
    const x = e.touches[0].pageX - slideshow.offsetLeft;
    const walk = (x - startX) * 2;
    slideshow.scrollLeft = scrollLeft - walk;
  }, { passive: true });
}

// Display video generator panel after slides are generated
function showVideoGenerator() {
  // Show the video generator section
  videoGenerator.removeAttribute('hidden');
  
  // Fetch available voices from the backend
  fetchAvailableVoices();
  
  // Setup event handlers for the video generator
  speedRange.addEventListener('input', () => {
    speedValue.textContent = speedRange.value;
  });
  
  languageSelect.addEventListener('change', () => {
    fetchAvailableVoices(languageSelect.value);
  });
  
  generateVideoBtn.addEventListener('click', () => {
    generateVideo();
  });
  
  shareBtn.addEventListener('click', () => {
    shareVideo();
  });
}

// Setup the video generator component
function setupVideoGenerator() {
  // Set default language
  languageSelect.value = 'id';
  
  // Initialize speed range dan pastikan nilai diupdate dengan benar
  speedRange.value = '1.0';
  speedValue.textContent = '1.0';
  
  // Tambahkan event listener untuk memastikan nilai speed diupdate
  speedRange.addEventListener('input', () => {
    // Format to 1 decimal place and force update
    const rawValue = parseFloat(speedRange.value);
    const formattedValue = rawValue.toFixed(1);
    
    // Update UI elements
    speedValue.textContent = formattedValue;
    speedRange.value = formattedValue;
    
    console.log("Kecepatan bicara diubah:", formattedValue);
    addLogEntry(`Kecepatan bicara diubah: ${formattedValue}x`);
  });
  
  // Tambahkan click event ke tombol untuk memastikan nilai kecepatan
  generateVideoBtn.addEventListener('click', () => {
    // Force update nilai kecepatan di slider
    const currentSpeed = parseFloat(speedRange.value).toFixed(1);
    speedValue.textContent = currentSpeed;
    console.log("Kecepatan yang akan digunakan:", currentSpeed);
  });
}

// Fetch available voices from the backend
async function fetchAvailableVoices(language = 'id') {
  try {
    // Clear current options
    voiceSelect.innerHTML = '<option value="loading">Memuat suara...</option>';
    
    // Fetch voices from API
    const response = await fetch(`http://localhost:8000/api/videos/voices?language=${language}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Voices data:", data); // Debug
    
    // Clear loading option
    voiceSelect.innerHTML = '';
    
    // Add voices to select
    if (data.voices && Array.isArray(data.voices)) {
      data.voices.forEach((voice: any) => {
        const option = document.createElement('option');
        option.value = voice.voice_id;
        option.textContent = voice.name;
        voiceSelect.appendChild(option);
      });
      
      if (data.voices.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Tidak ada suara tersedia untuk bahasa ini';
        voiceSelect.appendChild(option);
      }
    } else {
      throw new Error('Invalid response format');
    }
  } catch (err) {
    console.error('Error fetching voices:', err);
    voiceSelect.innerHTML = '<option value="">Error mengambil suara</option>';
  }
}

// Generate video from slides
async function generateVideo() {
  try {
    // Show progress section
    videoProgress.removeAttribute('hidden');
    videoResult.setAttribute('hidden', '');
    
    // Update status
    updateStatus('Memulai dengan Mode Sinkronisasi Audio Super Ketat v3...');
    updateProgress(5);
    addLogEntry('⚠️ MODE KHUSUS: SINKRONISASI AUDIO SUPER KETAT v3');
    addLogEntry('📊 Padding audio: 0.5 detik untuk setiap slide');
    
    // Parse speed rate
    const speedValue = parseFloat(speedRange.value);
    
    // Ambil slide yang dimasukkan
    const selectedSlides = Array.from(slideshow.querySelectorAll('.slide')).filter(slide => 
      (slide as HTMLElement).dataset.included === 'true'
    );
    
    if (selectedSlides.length === 0) {
      throw new Error('Tidak ada slide yang dipilih');
    }
    
    // Buat data slide yang SEDERHANA dengan durasi 0
    // Durasi 0 agar backend menghitung durasi berdasarkan panjang audio + padding
    const processedSlides = selectedSlides.map(slide => {
      const img = slide.querySelector('img') as HTMLImageElement;
      const caption = slide.querySelector('div:last-child');
      const text = caption?.textContent || '';
      
      return {
        image_url: img.src,
        text: text,
        duration: 0  // DURASI NOL: Backend akan menghitung durasi + padding berdasarkan audio
      };
    });
    
    // Request body yang sangat sederhana
    const requestBody = {
      slides: processedSlides,
      tts_options: {
        language: languageSelect.value,
        voice: voiceSelect.value,
        rate: speedValue,
        pitch: 1.0,
        volume: 1.0
      },
      min_duration: parseInt(minDuration.value),
      strict_sync: true // Tambahkan flag untuk sinkronisasi ketat
    };
    
    // Debug
    console.log("Kecepatan:", speedValue);
    addLogEntry(`Kecepatan bicara: ${speedValue}x`);
    addLogEntry(`Total slide: ${processedSlides.length}`);
    
    // Disable generate button
    generateVideoBtn.disabled = true;
    generateVideoBtn.textContent = 'Sedang Memproses...';
    
    updateStatus('Mengirim data...');
    updateProgress(10);
    addLogEntry(`Mode: SINKRONISASI AUDIO SUPER KETAT v3`);
    addLogEntry(`Padding: 0.5 detik per slide`);
    addLogEntry(`Delay transisi: 0.2 detik`);
    
    // Send request to API
    const response = await fetch('http://localhost:8000/api/videos/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error response:", errorText);
      throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Response data:", data);
    
    // Check if response contains needed data
    if (!data.video_id) {
      throw new Error('Invalid response - missing video_id');
    }
    
    const videoId = data.video_id;
    
    updateStatus('Video sedang dibuat...');
    updateProgress(20);
    addLogEntry('ID Video: ' + videoId);
    addLogEntry('⚠️ SINKRONISASI AUDIO SUPER KETAT DIAKTIFKAN');
    
    // Poll for status
    await pollVideoStatus(videoId);
    
  } catch (err: any) {
    console.error('Error generating video:', err);
    updateStatus('Error: ' + (err?.message || 'Unknown error'));
    addLogEntry('ERROR: ' + (err?.message || 'Unknown error'));
    
    // Re-enable button
    generateVideoBtn.disabled = false;
    generateVideoBtn.textContent = 'Coba Lagi';
  }
}

// Poll the backend for video status
async function pollVideoStatus(videoId: string) {
  if (!videoId || videoId === 'undefined') {
    updateStatus('Error: ID video tidak valid');
    addLogEntry('ERROR: ID video tidak valid');
    
    // Re-enable button
    generateVideoBtn.disabled = false;
    generateVideoBtn.textContent = 'Coba Lagi';
    return;
  }
  
  let isComplete = false;
  let progress = 20;
  let retryCount = 0;
  const maxRetries = 60; // Maximum number of retries (increased for longer video processing)
  let lastAudioSyncMessage = '';
  
  while (!isComplete && retryCount < maxRetries) {
    try {
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
      retryCount++;
      
      // Check status
      const response = await fetch(`http://localhost:8000/api/videos/status/${videoId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Status data:", data); // Debug
      
      // Update UI based on status
      updateStatus(data.status || 'processing');
      
      // Log progress
      if (data.log && data.log.length > 0) {
        data.log.forEach((logMessage: string) => {
          addLogEntry(logMessage);
        });
      }
      
      // Check for sync status messages dengan penanganan khusus
      if (data.sync_status && data.sync_status.length > 0) {
        data.sync_status.forEach((syncMessage: string) => {
          // Hindari duplicate messages
          if (syncMessage !== lastAudioSyncMessage) {
            // Log dengan format khusus untuk menunjukkan proses sinkronisasi
            addLogEntry(`🔄 ${syncMessage}`);
            lastAudioSyncMessage = syncMessage;
            
            // Jika menemukan pesan sinkronisasi audio, tingkatkan progres
            if (syncMessage.includes('audio') || syncMessage.includes('narasi')) {
              progress = Math.max(progress, 65);
              updateProgress(progress);
              addLogEntry('⏱️ Memproses timing dan sinkronisasi audio-video...');
            }
          }
        });
      }
      
      // Check untuk durasi audio dan timing sinkronisasi
      if (data.audio_timing && data.audio_timing.length > 0) {
        data.audio_timing.forEach((timing: any) => {
          const slideDuration = timing.duration.toFixed(2);
          const audioDuration = timing.audio_duration.toFixed(2);
          addLogEntry(`📊 Slide ${timing.slide_index + 1}: Audio ${audioDuration}s, Total ${slideDuration}s`);
        });
        
        // Perbarui progres ke tahap sinkronisasi
        progress = Math.max(progress, 75);
        updateProgress(progress);
      }
      
      // Update progress bar
      if (data.progress) {
        progress = Math.max(progress, data.progress);
        updateProgress(progress);
        
        // Tambahkan log khusus untuk progres pembuatan video
        if (data.progress >= 80 && data.progress < 90) {
          addLogEntry('Menyinkronkan audio dengan pergantian slide (ketat)...');
        } else if (data.progress >= 90 && data.progress < 95) {
          addLogEntry('Menerapkan transisi antar slide...');
        } else if (data.progress >= 95) {
          addLogEntry('Menyelesaikan render video...');
        }
      }
      
      // Check if complete
      if (data.status === 'completed') {
        isComplete = true;
        updateProgress(100);
        addLogEntry('✅ Video berhasil dibuat dengan sinkronisasi audio ketat!');
        
        // Verifikasi ukuran video
        if (data.file_size && data.file_size < 50000) { // Kurang dari 50KB
          addLogEntry('⚠️ PERINGATAN: Ukuran video sangat kecil, kemungkinan ada masalah');
        }
        
        showCompletedVideo(data.video_url);
      } else if (data.status === 'failed') {
        throw new Error(data.error_message || 'Video generation failed');
      }
      
    } catch (err: any) {
      console.error('Error checking video status:', err);
      addLogEntry('ERROR: ' + (err.message || 'Error checking status'));
      updateStatus('Error: ' + (err.message || 'Error checking status'));
      
      // If we've reached max retries, stop polling
      if (retryCount >= maxRetries) {
        // Re-enable button
        generateVideoBtn.disabled = false;
        generateVideoBtn.textContent = 'Coba Lagi';
        return;
      }
    }
  }
}

// Show completed video
function showCompletedVideo(videoUrl: string) {
  if (!videoUrl) {
    addLogEntry('ERROR: URL video tidak ditemukan');
    updateStatus('Error: URL video tidak ditemukan');
    
    // Re-enable button
    generateVideoBtn.disabled = false;
    generateVideoBtn.textContent = 'Coba Lagi';
    return;
  }
  
  console.log("Video URL:", videoUrl); // Debug
  
  // Hide progress, show result
  videoProgress.setAttribute('hidden', '');
  videoResult.removeAttribute('hidden');
  
  // Update video source
  resultVideo.src = videoUrl;
  resultVideo.load(); // Force reload video element
  
  // Update download link
  downloadLink.href = videoUrl;
  downloadLink.download = 'tiny-cats-video.mp4';
  
  // Re-enable button
  generateVideoBtn.disabled = false;
  generateVideoBtn.textContent = 'Buat Video Baru';
  
  // Auto-scroll to video result
  videoResult.scrollIntoView({ behavior: 'smooth' });
}

// Helper functions for UI updates
function updateStatus(status: string): void {
  statusText.textContent = status;
}

function updateProgress(percent: number): void {
  progressBar.style.width = `${percent}%`;
}

function addLogEntry(message: string): void {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = message;
  progressLog.appendChild(entry);
  
  // Auto-scroll log to bottom
  progressLog.scrollTop = progressLog.scrollHeight;
}

function shareVideo() {
  if (navigator.share && resultVideo.src) {
    navigator.share({
      title: 'Video Tiny Cats Saya',
      text: 'Lihat video penjelasan kucing kecil saya!',
      url: resultVideo.src
    })
    .catch((error) => console.log('Error sharing:', error));
  } else {
    alert('Copy video URL: ' + resultVideo.src);
  }
}

// Fungsi untuk membuka editor gambar
function openDrawingEditor(slide: HTMLElement, image: HTMLImageElement) {
  // Simpan referensi ke gambar yang sedang diedit
  currentImage = image;
  currentEditSlide = slide;
  
  // Set ukuran canvas sesuai gambar
  const MAX_WIDTH = 800;
  const MAX_HEIGHT = 600;
  let width = image.naturalWidth;
  let height = image.naturalHeight;
  
  // Skala gambar jika terlalu besar
  if (width > MAX_WIDTH) {
    const ratio = MAX_WIDTH / width;
    width = MAX_WIDTH;
    height = height * ratio;
  }
  
  if (height > MAX_HEIGHT) {
    const ratio = MAX_HEIGHT / height;
    height = height * ratio;
    width = width * ratio;
  }
  
  // Set ukuran canvas
  drawingCanvas.width = width;
  drawingCanvas.height = height;
  
  // Reset history
  history.length = 0;
  redoStack.length = 0;
  historyIndex = -1;
  
  // Gambar image ke canvas
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  
  // Simpan state awal ke history
  saveToHistory();
  
  // Tampilkan modal
  drawEditorModal.classList.add('active');
}

// Simpan state canvas ke history
function saveToHistory() {
  // Hapus semua redo jika ada penambahan history baru
  if (historyIndex < history.length - 1) {
    history.splice(historyIndex + 1);
    redoStack.length = 0;
  }
  
  const imageData = ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
  history.push(imageData);
  historyIndex = history.length - 1;
  
  // Update status tombol undo/redo
  updateUndoRedoButtons();
}

// Update status tombol undo/redo
function updateUndoRedoButtons() {
  undoBtn.disabled = historyIndex <= 0;
  redoBtn.disabled = redoStack.length === 0;
}

// Undo perubahan
function undo() {
  if (historyIndex > 0) {
    // Simpan state saat ini ke redo stack
    redoStack.push(history[historyIndex]);
    
    // Kurangi index
    historyIndex--;
    
    // Restore image data
    ctx.putImageData(history[historyIndex], 0, 0);
    
    // Update status tombol
    updateUndoRedoButtons();
  }
}

// Redo perubahan
function redo() {
  if (redoStack.length > 0) {
    // Ambil state terakhir dari redo stack
    const imageData = redoStack.pop() as ImageData;
    
    // Tambahkan ke history dan tambah index
    history.push(imageData);
    historyIndex++;
    
    // Restore image data
    ctx.putImageData(imageData, 0, 0);
    
    // Update status tombol
    updateUndoRedoButtons();
  }
}

// Clear canvas
function clearCanvas() {
  if (confirm('Yakin ingin menghapus semua coretan?')) {
    // Simpan state saat ini ke history sebelum clear
    saveToHistory();
    
    // Clear canvas
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    
    // Gambar image asli
    if (currentImage) {
      ctx.drawImage(currentImage, 0, 0, drawingCanvas.width, drawingCanvas.height);
    }
    
    // Simpan state baru ke history
    saveToHistory();
  }
}

// Mulai menggambar
function startDrawing(e: MouseEvent | TouchEvent) {
  isDrawing = true;
  
  // Dapatkan posisi
  const pos = getPosition(e);
  lastX = pos.x;
  lastY = pos.y;
  
  // Gambar titik
  ctx.beginPath();
  ctx.arc(lastX, lastY, currentSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = currentTool === 'brush' ? currentColor : '#ffffff';
  ctx.fill();
}

// Gambar
function draw(e: MouseEvent | TouchEvent) {
  if (!isDrawing) return;
  
  // Dapatkan posisi
  const pos = getPosition(e);
  const x = pos.x;
  const y = pos.y;
  
  // Set style
  ctx.lineWidth = currentSize;
  ctx.lineCap = 'round';
  ctx.strokeStyle = currentTool === 'brush' ? currentColor : '#ffffff';
  
  // Gambar line
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
  
  // Update last position
  lastX = x;
  lastY = y;
}

// Berhenti menggambar
function stopDrawing() {
  if (isDrawing) {
    isDrawing = false;
    saveToHistory();
  }
}

// Dapatkan posisi mouse/touch relatif terhadap canvas
function getPosition(e: MouseEvent | TouchEvent) {
  const rect = drawingCanvas.getBoundingClientRect();
  
  let clientX, clientY;
  
  // Check jika event adalah TouchEvent
  if ('touches' in e) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

// Simpan hasil edit gambar
function saveEditedDrawing() {
  if (!currentImage || !currentEditSlide) return;
  
  // Konversi canvas ke data URL
  const dataURL = drawingCanvas.toDataURL('image/png');
  
  // Update src image
  currentImage.src = dataURL;
  
  // Tutup modal
  closeDrawingEditor();
}

// Tutup editor gambar
function closeDrawingEditor() {
  drawEditorModal.classList.remove('active');
  currentImage = null;
  currentEditSlide = null;
}

// Setup event untuk editor gambar
function setupDrawingEditor() {
  // Color picker
  colorPicker.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('color-option')) {
      // Remove active class dari semua options
      document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('active');
      });
      
      // Add active class ke option yang dipilih
      target.classList.add('active');
      
      // Set current color
      currentColor = target.getAttribute('data-color') || '#000000';
      
      // Set tool ke brush
      setTool('brush');
    }
  });
  
  // Size slider
  sizeSlider.addEventListener('input', () => {
    currentSize = parseInt(sizeSlider.value);
    sizeValue.textContent = sizeSlider.value;
  });
  
  // Tool buttons
  brushTool.addEventListener('click', () => setTool('brush'));
  eraserTool.addEventListener('click', () => setTool('eraser'));
  
  // Set tool
  function setTool(tool: string) {
    currentTool = tool;
    
    // Update active class
    brushTool.classList.toggle('active', tool === 'brush');
    eraserTool.classList.toggle('active', tool === 'eraser');
  }
  
  // History buttons
  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);
  clearBtn.addEventListener('click', clearCanvas);
  
  // Canvas drawing events
  drawingCanvas.addEventListener('mousedown', startDrawing);
  drawingCanvas.addEventListener('mousemove', draw);
  window.addEventListener('mouseup', stopDrawing);
  
  // Touch events
  drawingCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startDrawing(e);
  });
  
  drawingCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(e);
  });
  
  drawingCanvas.addEventListener('touchend', () => {
    stopDrawing();
  });
  
  // Modal buttons
  drawingClose.addEventListener('click', closeDrawingEditor);
  cancelDrawing.addEventListener('click', closeDrawingEditor);
  saveDrawing.addEventListener('click', saveEditedDrawing);
}
