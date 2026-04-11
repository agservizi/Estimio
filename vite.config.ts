import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { wikicasaDevPlugin } from './vite-plugin-wikicasa'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode !== 'production' ? [wikicasaDevPlugin()] : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-charts': ['recharts'],
          'vendor-motion': ['framer-motion'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-pdf': ['html2pdf.js'],
        },
      },
    },
  },
}))
