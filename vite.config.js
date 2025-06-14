import { defineConfig } from 'vite';

export default defineConfig({
  // Menyediakan API key sebagai environment variable
  define: {
    // Menggunakan string JSON agar nilai bisa diakses melalui process.env
    'process.env.GEMINI_API_KEY': JSON.stringify('set api key')
  },
  
  // Konfigurasi dev server
  server: {
    // Menambahkan CORS headers untuk mendukung cross-origin isolation
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  }
}); 
