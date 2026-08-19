import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

const backendTarget = process.env.VITE_BACKEND_URL ?? 'http://localhost:3000';
const webDir = path.dirname(fileURLToPath(import.meta.url));
const appBuildId = process.env.VIPEX_BUILD_ID ?? process.env.GITHUB_SHA ?? new Date().toISOString();

export default defineConfig({
  // The app is served from the domain root. Absolute asset URLs keep client-side
  // routes such as /parcels from resolving bundles relative to the route path.
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'inject-build-id-meta',
      transformIndexHtml(html) {
        const safeBuildId = appBuildId.replace(/"/g, '&quot;');
        return html.replace(
          '</head>',
          `  <meta name="x-app-build" content="${safeBuildId}" />\n  </head>`,
        );
      },
    },
  ],
  define: {
    __APP_BUILD_ID__: JSON.stringify(appBuildId),
  },
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
