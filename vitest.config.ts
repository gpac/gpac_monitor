/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'std': resolve(__dirname, './src/test/stubs/gpac-std.js'),
      'os': resolve(__dirname, './src/test/stubs/gpac-os.js'),
      'gpaccore': resolve(__dirname, './src/test/stubs/gpac-core.js'),
    },
  },
});