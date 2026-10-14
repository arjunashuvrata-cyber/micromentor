import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In development, forward /api/* to the local FastAPI server
    // (run with: uvicorn api.index:app --reload --port 8000).
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
