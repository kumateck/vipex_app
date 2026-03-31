import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

const backendTarget = process.env.VITE_BACKEND_URL ?? 'http://localhost:3000';
const webDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(webDir, '../../src'),
      '@ui': path.resolve(webDir, '../../packages/ui/src'),
      '@lib': path.resolve(webDir, '../../packages/lib/src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: [path.resolve(webDir, '../..')],
    },
    proxy: {
      '/v1': {
        target: backendTarget,
        changeOrigin: true,
        ws: true,
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
