import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolveReleaseVersion } from './scripts/releaseVersion';

export default defineConfig(({ mode }) => {
  // Shell and .env-file overrides win; the latest release tag is the fallback.
  const appVersion = loadEnv(mode, process.cwd(), 'VITE_').VITE_APP_VERSION || resolveReleaseVersion();

  return {
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
  };
});
