import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    __DESKTOP_WEB_BASE_URL__: JSON.stringify(process.env.DESKTOP_WEB_BASE_URL ?? ''),
    __DESKTOP_UPDATE_FEED_URL__: JSON.stringify(process.env.DESKTOP_UPDATE_FEED_URL ?? ''),
  },
  build: {
    outDir: '.vite/build',
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: ['electron'],
    },
  },
});
