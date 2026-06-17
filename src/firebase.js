import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDbF6rg4XEXf7vv944L1x-Tz7MQVKUs_zc',
  authDomain: 'growhub-52432.firebaseapp.com',
  projectId: 'growhub-52432',
  storageBucket: 'growhub-52432.firebasestorage.app',
  messagingSenderId: '196568516536',
  appId: '1:196568516536:web:b91747afe89673d901b14d',
  measurementId: 'G-CJKQ237W47',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
