import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../firebase'

export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

export const registerUser = async (email, password, displayName) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  if (displayName) {
    await updateProfile(cred.user, { displayName })
  }
  return cred
}

export const resetPassword = (email) => sendPasswordResetEmail(auth, email)

export const logoutUser = () => signOut(auth)

// Actualiza el perfil del usuario actual (nombre y/o URL de foto).
export const updateUserProfile = ({ displayName, photoURL }) =>
  updateProfile(auth.currentUser, { displayName, photoURL })

// Traduce los códigos de error de Firebase Auth a mensajes legibles en español.
export const authErrorMessage = (code) => {
  const map = {
    'auth/invalid-email': 'El email no es válido.',
    'auth/user-disabled': 'Esta cuenta está deshabilitada.',
    'auth/user-not-found': 'No existe ninguna cuenta con ese email.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/invalid-credential': 'Email o contraseña incorrectos.',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/missing-password': 'Introduce una contraseña.',
    'auth/too-many-requests': 'Demasiados intentos. Inténtalo más tarde.',
  }
  return map[code] || 'Ha ocurrido un error. Inténtalo de nuevo.'
}
