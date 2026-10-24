import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  // In development the app runs on http://localhost:5173 and forwards every
  // /api request and the Socket.IO connection to the HTTPS proxy started by
  // `docker compose up`, so the session cookie and all routes behave exactly
  // like in production.
  const apiTarget = loadEnv(mode, process.cwd(), '').API_PROXY_TARGET || 'https://localhost:8443';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          // The proxy uses a self-signed certificate.
          secure: false,
        },
        '/socket.io': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
    preview: { port: 4173 },
    // `npm test`: the tests sit next to the code they check, in files ending in
    // .test.ts or .test.tsx.
    test: { environment: 'jsdom' },
    build: {
      target: 'es2022',
      sourcemap: true,
      // The main chunk holds React, Socket.IO and the texts of all three
      // languages (about 580 kB); pages are loaded on demand.
      chunkSizeWarningLimit: 1000,
    },
  };
});
