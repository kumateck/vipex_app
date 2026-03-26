import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';

const backendTarget = process.env.VITE_BACKEND_URL ?? 'http://localhost:3000';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
      '@ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@lib': path.resolve(__dirname, '../../packages/lib/src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: [path.resolve(__dirname, '../..')],
    },
    proxy: {
      '/v1': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/health': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/docs': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/dev': {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
});
