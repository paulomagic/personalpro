import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load all env variables (empty prefix to load all)
  loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;

            if (id.includes('/react/') || id.includes('/react-dom/')) {
              return 'vendor-react';
            }
            if (id.includes('/@supabase/')) {
              return 'vendor-supabase';
            }
            if (id.includes('/recharts/')) {
              return 'vendor-charts';
            }
            if (id.includes('/framer-motion/')) {
              return 'vendor-motion';
            }
            if (id.includes('/lucide-react/')) {
              return 'vendor-icons';
            }
            if (id.includes('/zod/')) {
              return 'vendor-zod';
            }

            return 'vendor-misc';
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
