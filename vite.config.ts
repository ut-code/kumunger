// Module declarations for build environment
declare module 'vite' {
  export function defineConfig(config: any): any
}
declare module '@vitejs/plugin-react' {
  export default function react(): any
}

// Type-safe access to process.env
declare const process: {
  env: Record<string, string | undefined>
}

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: process.env.RENDER
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
})
