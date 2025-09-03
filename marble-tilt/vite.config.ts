import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // HTTPS config removed for production build
    host: true, // Expose to local network
    port: 3000,
  },
});
