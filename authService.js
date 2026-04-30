import { initializeApp } from "firebase/app"
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"

const firebaseConfig = {

  apiKey: "AIzaSyDbF6rg4XEXf7vv944L1x-Tz7MQVKUs_zc",

  authDomain: "growhub-52432.firebaseapp.com",

  projectId: "growhub-52432",

  storageBucket: "growhub-52432.firebasestorage.app",

  messagingSenderId: "196568516536",

  appId: "1:196568516536:web:b91747afe89673d901b14d",

  measurementId: "G-CJKQ237W47"

}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

export const loginUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password)
}

export const registerUser = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password)
}