import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    __DESKTOP_WEB_BASE_URL__: JSON.stringify(process.env.DESKTOP_WEB_BASE_URL ?? ''),
    __DESKTOP_UPDATE_FEED_URL__: JSON.stringify(process.env.DESKTOP_UPDATE_FEED_URL ?? ''),
  },
  build: {
    ssr: 'src/main.ts',
    outDir: '.vite/build',
    emptyOutDir: false,
    sourcemap: true,
    minify: false,
    rollupOptions: {
      input: 'src/main.ts',
      external: ['electron'],
      output: {
        entryFileNames: 'main.js',
        format: 'cjs',
      },
    },
  },
});
