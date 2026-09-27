import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { analysisApi } from './server/analysisApi.ts'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss(), analysisApi()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})