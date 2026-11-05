import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // Sans host, Vite n'écoute que sur le localhost du conteneur
    host: true,
    proxy: { '/api': 'http://localhost:3000' },
  },
});
