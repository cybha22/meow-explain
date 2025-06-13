/**
 * Tiny Cats - Video Generator Integration Script
 * 
 * File ini berisi fungsi-fungsi untuk mengintegrasikan 
 * backend video generator dengan frontend Tiny Cats.
 */

const TinyCatsVideoAPI = {
  /**
   * Base URL untuk API
   */
  baseURL: 'http://localhost:8000',
  
  /**
   * Mendapatkan daftar suara TTS yang tersedia
   * @returns {Promise<Object>} - Daftar suara yang tersedia
   */
  async getAvailableVoices() {
    try {
      const response = await fetch(`${this.baseURL}/api/videos/voices`);
      return await response.json();
    } catch (error) {
      console.error('Error getting available voices:', error);
      throw error;
    }
  },
  
  /**
   * Menghasilkan video dari slide
   * @param {Array} slides - Array slide yang berisi teks dan URL gambar
   * @param {Object} ttsOptions - Opsi TTS (language, voice, rate, pitch, volume)
   * @param {Number} minDuration - Durasi minimum video (default: 35 detik)
   * @returns {Promise<Object>} - Informasi video yang dihasilkan
   */
  async generateVideo(slides, ttsOptions, minDuration = 35.0) {
    try {
      // Konversi format slide
      const formattedSlides = slides.map(slide => ({
        text: slide.text,
        image_url: slide.image || slide.image_url || slide.imageUrl,
        duration: slide.duration || 5.0
      }));
      
      // Konversi format TTS options
      const formattedTTSOptions = {
        language: ttsOptions.language || 'id',
        voice: ttsOptions.voice || 'id-ID-Standard-A',
        rate: ttsOptions.rate || 1.0,
        pitch: ttsOptions.pitch || 1.0,
        volume: ttsOptions.volume || 1.0
      };
      
      // Buat request body
      const requestBody = {
        slides: formattedSlides,
        tts_options: formattedTTSOptions,
        min_duration: minDuration
      };
      
      // Kirim request ke API
      const response = await fetch(`${this.baseURL}/api/videos/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error generating video:', error);
      throw error;
    }
  },
  
  /**
   * Menghasilkan video dari slide yang sudah ada di frontend
   * @param {Array} slides - Array slide dari frontend
   * @param {Object} ttsOptions - Opsi TTS
   * @returns {Promise<Object>} - Informasi video yang dihasilkan
   */
  async generateVideoFromSlides(slides, ttsOptions) {
    try {
      // Kirim request ke API
      const response = await fetch(`${this.baseURL}/api/integration/generate-from-slides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          slides: slides,
          tts_options: ttsOptions
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error generating video from slides:', error);
      throw error;
    }
  },
  
  /**
   * Memeriksa status pembuatan video
   * @param {String} videoId - ID video yang sedang diproses
   * @returns {Promise<Object>} - Status video
   */
  async checkVideoStatus(videoId) {
    try {
      const response = await fetch(`${this.baseURL}/api/videos/status/${videoId}`);
      return await response.json();
    } catch (error) {
      console.error('Error checking video status:', error);
      throw error;
    }
  },
  
  /**
   * Upload file gambar ke server
   * @param {File} file - File gambar yang akan diupload
   * @returns {Promise<Object>} - Informasi file yang diupload
   */
  async uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${this.baseURL}/api/integration/upload-image`, {
        method: 'POST',
        body: formData
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },
  
  /**
   * Polling status pembuatan video
   * @param {String} videoId - ID video yang sedang diproses
   * @param {Function} onUpdate - Callback saat status diupdate
   * @param {Function} onComplete - Callback saat video selesai
   * @param {Number} interval - Interval polling dalam milidetik (default: 5000)
   * @param {Number} maxAttempts - Jumlah maksimum polling (default: 30)
   */
  pollVideoStatus(videoId, onUpdate, onComplete, interval = 5000, maxAttempts = 30) {
    let attempts = 0;
    
    const checkStatus = async () => {
      try {
        const status = await this.checkVideoStatus(videoId);
        
        // Panggil callback onUpdate
        if (onUpdate) {
          onUpdate(status, attempts);
        }
        
        // Jika sudah selesai, panggil callback onComplete
        if (status.status === 'completed') {
          if (onComplete) {
            onComplete(status);
          }
          return;
        }
        
        // Jika belum selesai dan masih dalam batas maksimum, lanjutkan polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, interval);
        } else {
          throw new Error('Timed out waiting for video to complete');
        }
      } catch (error) {
        console.error('Error polling video status:', error);
      }
    };
    
    // Mulai polling
    checkStatus();
  }
};

// Export TinyCatsVideoAPI ke window
window.TinyCatsVideoAPI = TinyCatsVideoAPI; 