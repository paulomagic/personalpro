import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load all env variables (empty prefix to load all)
  const env = loadEnv(mode, process.cwd(), '');

  console.log('🔑 Vite loading env - GEMINI key found:', !!env.VITE_GEMINI_API_KEY);

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
