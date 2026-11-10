import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Sans host, Vite n'écoute que sur le localhost du conteneur
    host: true,
    proxy: { '/api': 'http://localhost:3000' },
  },
});
