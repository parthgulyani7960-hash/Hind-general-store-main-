import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: false,
      host: '0.0.0.0',
      port: 3000,
    },
    optimizeDeps: {
      include: [
        'react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/auth', 
        'firebase/firestore', 'lucide-react', 'motion/react', 'react-hot-toast'
      ]
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'vendor-ui': ['lucide-react', 'motion/react', 'react-hot-toast'],
            'vendor-utils': ['qrcode.react', 'date-fns', 'recharts']
          }
        }
      }
    }
  };
});
