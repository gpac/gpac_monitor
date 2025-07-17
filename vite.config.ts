import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './', // Relative paths for double-click
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), 
    },
  },
  build: {
    assetsInlineLimit: 100000000, // Inline all assets
    cssCodeSplit: false, // Single CSS file
    rollupOptions: {
      output: {
        manualChunks: undefined, // Single JS file
      }
    }
  }
})