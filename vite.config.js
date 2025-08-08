import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'cute-results-give.loca.lt' // 👈 your localtunnel URL
    ]
  }
});
