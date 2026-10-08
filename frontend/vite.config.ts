/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // In development the app runs on http://localhost:5173 and forwards every
  // /api request (and the Socket.IO connection, when VITE_REALTIME=socket) to
  // the HTTPS proxy started by `docker compose up`, so the session cookie and
  // all routes behave exactly like in production. Set API_PROXY_TARGET (in the
  // shell or in .env.local) if the proxy runs elsewhere.
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
    build: {
      target: 'es2022',
      sourcemap: true,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      restoreMocks: true,
    },
  };
});
