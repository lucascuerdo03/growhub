import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// `vite --mode emulator`: usa los emuladores locales de Firebase. El proyecto
// demo-* no existe en la nube, así que las pruebas no pueden tocar datos reales.
const usarEmuladores = import.meta.env.VITE_USE_EMULATORS === 'true'

const firebaseConfig = {
  apiKey: 'AIzaSyDbF6rg4XEXf7vv944L1x-Tz7MQVKUs_zc',
  authDomain: 'growhub-52432.firebaseapp.com',
  projectId: usarEmuladores ? 'demo-growhub' : 'growhub-52432',
  storageBucket: 'growhub-52432.firebasestorage.app',
  messagingSenderId: '196568516536',
  appId: '1:196568516536:web:b91747afe89673d901b14d',
  measurementId: 'G-CJKQ237W47',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

if (usarEmuladores) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

export default app
