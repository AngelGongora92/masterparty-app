import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Se asume que estas variables globales son inyectadas por el entorno de Canvas
// o definidas en tu entorno de desarrollo.
const firebaseConfig = typeof __firebase_config !== 'undefined'
    ? JSON.parse(__firebase_config)
    : {
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
    throw new Error(`Error de configuración de Firebase: Faltan las siguientes claves en tu archivo .env o en la configuración: ${missingKeys.join(', ')}. Asegúrate de que el servidor de Vite se haya reiniciado después de crear el archivo .env.`);
}

export const appId = typeof __app_id !== 'undefined' ? __app_id : 'dev-app-id';
export const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

export const app = initializeApp(firebaseConfig); // Initialize the Firebase App
export const db = getFirestore(app, '(default)'); // Explicitly specify the default database ID
export const auth = getAuth(app);
export const analytics = getAnalytics(app);

if (import.meta.env.VITE_USE_EMULATORS) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
}