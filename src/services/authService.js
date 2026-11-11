import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../firebase'
import { guardarUsuario } from './firestoreService'

export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

export const registerUser = async (email, password, displayName) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  if (displayName) {
    await updateProfile(cred.user, { displayName })
  }
  // Si esto falla no se pierde el registro: se reintenta al entrar en la app.
  try {
    await guardarUsuario(cred.user.uid, {
      nombre: displayName || email.split('@')[0],
      email: cred.user.email,
    })
  } catch (e) {
    console.warn('No se pudo crear el perfil de usuario:', e)
  }
  // Enviamos el correo de verificación tras crear la cuenta.
  await sendEmailVerification(cred.user)
  return cred
}

// Reenvía el correo de verificación al usuario que esté en sesión.
export const resendVerification = () => {
  if (auth.currentUser) return sendEmailVerification(auth.currentUser)
  return Promise.reject(new Error('No hay sesión activa.'))
}

export const resetPassword = (email) => sendPasswordResetEmail(auth, email)

export const logoutUser = () => signOut(auth)

// Actualiza el perfil del usuario actual.
export const updateUserProfile = (datos) => updateProfile(auth.currentUser, datos)

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
    'auth/network-request-failed': 'No hay conexión. Revisa tu red e inténtalo de nuevo.',
  }
  return map[code] || 'Ha ocurrido un error. Inténtalo de nuevo.'
}

// Campo del formulario al que corresponde cada error, para mostrarlo debajo; los
// que no son de un campo concreto (credenciales, demasiados intentos) van aparte.
export const campoDeError = (code) =>
  ({
    'auth/invalid-email': 'email',
    'auth/user-not-found': 'email',
    'auth/email-already-in-use': 'email',
    'auth/user-disabled': 'email',
    'auth/wrong-password': 'password',
    'auth/weak-password': 'password',
    'auth/missing-password': 'password',
  })[code] || ''

// Comprobaciones antes de llamar a Firebase. Devuelven el mensaje o ''.
export const validarEmail = (email) => {
  if (!email.trim()) return 'Escribe tu email.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'El email no es válido.'
  return ''
}
