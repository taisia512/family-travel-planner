import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    react(),
    basicSsl() // enables HTTPS for the Vite dev server with an auto-generated cert
  ],
  server: {
    https: true,
    port: 5173,
    host: '0.0.0.0' // allows access from other devices on the same LAN / hotspot
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true
  }
});