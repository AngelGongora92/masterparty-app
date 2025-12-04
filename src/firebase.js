import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';

// Lee la configuración directamente desde las variables de entorno de Vite.
// El prefijo VITE_ es necesario para que se expongan al cliente.
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// --- Validación de Configuración ---
// Verifica que todas las claves necesarias para Firebase estén presentes.
// Si alguna falta, la inicialización fallará y este error te dirá exactamente cuál es.
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);
if (missingKeys.length > 0) {
    throw new Error(`Error de configuración de Firebase: Faltan las siguientes claves en tu archivo .env: ${missingKeys.join(', ')}. Asegúrate de que el servidor de Vite se haya reiniciado después de crear el archivo .env.`);
}

// Exportamos el ID del proyecto para usarlo en otras partes de la app si es necesario
export const appId = firebaseConfig.projectId;

// Inicializa los servicios de Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = firebaseConfig.measurementId ? getAnalytics(app) : null;