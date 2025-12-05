import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Redirige las peticiones que empiezan con /api/lead
      // al emulador de Firebase Functions que corre en el puerto 5001.
      '/api': {
        // La URL base que nos dio el emulador para tus funciones
        target: 'http://127.0.0.1:5001/masterparty-app/us-central1',
        changeOrigin: true,
        // Reescribimos la ruta: quitamos /api/lead y la reemplazamos por /addProviderLead
        rewrite: (path) => path.replace(/^\/api\/lead/, '/addProviderLead'),
      },
    },
  },
})