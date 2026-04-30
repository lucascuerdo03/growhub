import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc } from "firebase/firestore"
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
const db = getFirestore(app)

export const createHuerto = async (nombre, descripcion) => {
  await addDoc(collection(db, "huertos"), {
    nombre: nombre,
    descripcion: descripcion
  })
}

export const deleteHuerto = async (id) => {
  await deleteDoc(doc(db, "huertos", id))
}

export const getHuertos = async () => {
  const querySnapshot = await getDocs(collection(db, "huertos"))
  const huertos = []

  querySnapshot.forEach((doc) => {
    huertos.push({ id: doc.id, ...doc.data() })
  })

  return huertos
}