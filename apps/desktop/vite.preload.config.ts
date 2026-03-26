import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: '.vite/build',
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: ['electron'],
    },
  },
});
