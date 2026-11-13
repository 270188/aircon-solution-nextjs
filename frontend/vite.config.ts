import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

import { seoPlugin } from './seo';

export default defineConfig({
  plugins: [react(), seoPlugin()],
  server: {
    port: 4200,
    // En desarrollo las llamadas /api van al backend Spring Boot.
    proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    globals: false,
  },
});
