import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    host: true, // Necessário para o túnel encontrar o servidor
    port: 5173,
    https: false // Desativamos aqui, pois o Túnel já fornece HTTPS seguro
  }
});
