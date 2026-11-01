import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolveReleaseVersion } from './scripts/releaseVersion';

const appVersion = process.env.VITE_APP_VERSION || resolveReleaseVersion();

export default defineConfig({
  define: appVersion
    ? { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion) }
    : {},
  plugins: [
    react()
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled'
    ],
    exclude: ['lucide-react']
  }
});
