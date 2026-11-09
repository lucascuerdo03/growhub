import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// `vite --mode emulator` (npm run dev:emu): usa los emuladores locales de Firebase.
// El proyecto demo-* no existe en la nube, así que las pruebas no pueden tocar
// datos reales, y no hace falta ninguna clave.
const usarEmuladores = import.meta.env.MODE === 'emulator'

// La configuración del proyecto real sale de .env (ver .env.example), que no se
// sube al repositorio.
const env = import.meta.env
const firebaseConfig = usarEmuladores
  ? { apiKey: 'demo', authDomain: 'demo-growhub.firebaseapp.com', projectId: 'demo-growhub' }
  : {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    }

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Falta la configuración de Firebase: copia .env.example a .env y rellénalo (ver README).')
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

if (usarEmuladores) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

export default app
