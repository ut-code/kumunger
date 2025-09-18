import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Node.js process declaration for this file
declare const process: {
  env: Record<string, string | undefined>
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: mode === 'production' || process.env.RENDER
      ? [".onrender.com"]
      : [],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
}))
