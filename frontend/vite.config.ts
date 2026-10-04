import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During dev the SPA runs on :5173 and proxies API + websocket to the API on :3000.
// In production nginx serves the built assets and proxies these same paths.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3000', ws: true, changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
