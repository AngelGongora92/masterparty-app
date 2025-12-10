import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno del archivo .env correspondiente al modo actual (development/production)
  const env = loadEnv(mode, process.cwd(), '');
  const projectId = env.VITE_FIREBASE_PROJECT_ID;
  const functionsEmulatorTarget = `http://127.0.0.1:5001/${projectId}/us-central1`;

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy para la función de leads de proveedores
        '/api/lead': {
          target: functionsEmulatorTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/lead/, '/addProviderLead'),
        },
        // Proxy para la nueva función de verificación de correo
        '/api/send-verification-email': {
          target: functionsEmulatorTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/send-verification-email/, '/sendCustomVerificationEmail'),
        },
      },
    },
  }
})