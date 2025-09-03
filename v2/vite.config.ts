import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Check if SSL certificates exist
const rootPath = __dirname;
// Try both naming patterns for certificates
const httpsConfig = 
  // First try the "localhost+2" pattern that exists in the root
  (fs.existsSync(path.join(rootPath, 'localhost+2.pem')) && 
  fs.existsSync(path.join(rootPath, 'localhost+2-key.pem')))
  ? {
      key: fs.readFileSync(path.join(rootPath, 'localhost+2-key.pem')),
      cert: fs.readFileSync(path.join(rootPath, 'localhost+2.pem'))
    }
  // Fallback to the pattern specified in the original config
  : (fs.existsSync(path.join(rootPath, 'certs', 'localhost.pem')) && 
     fs.existsSync(path.join(rootPath, 'certs', 'localhost-key.pem')))
    ? {
        key: fs.readFileSync(path.join(rootPath, 'certs', 'localhost-key.pem')),
        cert: fs.readFileSync(path.join(rootPath, 'certs', 'localhost.pem'))
      }
    : undefined;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@client': path.resolve(__dirname, './src/client'),
      '@server': path.resolve(__dirname, './src/server'),
      '@shared': path.resolve(__dirname, './src/shared')
    }
  },
  server: {
    https: httpsConfig,
    port: 3000,
    host: true, // Listen on all addresses
    strictPort: true, // Do not try another port if 3000 is in use
    proxy: {
      '/api': {
        target: 'https://localhost:3001',
        secure: false, // Accept self-signed certificates
        changeOrigin: true
      },
      '/socket.io': {
        target: 'wss://localhost:3001',
        secure: false,
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    emptyOutDir: true
  }
});
