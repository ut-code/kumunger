/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Module declarations for packages without proper TypeScript declarations
declare module 'react-dom/client'
declare module 'uuid'
declare module 'qrcode'

// CSS module declarations
declare module '*.css' {
  const content: Record<string, string>
  export default content
}
