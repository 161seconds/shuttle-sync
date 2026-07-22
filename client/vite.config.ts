import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react-vendor';
            if (id.includes('lucide-react') || id.includes('framer-motion')) return 'ui-vendor';
            if (id.includes('recharts') || id.includes('chart.js')) return 'chart-vendor';
            return 'vendor';
          }
        }
      }
    }
  }
});