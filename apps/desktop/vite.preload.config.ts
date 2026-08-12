import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    ssr: 'src/preload.ts',
    outDir: '.vite/build',
    emptyOutDir: false,
    sourcemap: true,
    minify: false,
    rollupOptions: {
      input: 'src/preload.ts',
      external: ['electron'],
      output: {
        entryFileNames: 'preload.js',
        format: 'cjs',
      },
    },
  },
});
