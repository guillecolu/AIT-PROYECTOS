// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAgBarQePktzbwTE4wVDzgZ1ahyNgHT2Zc",
  authDomain: "machinetrack-uauk1.firebaseapp.com",
  projectId: "machinetrack-uauk1",
  storageBucket: "machinetrack-uauk1.firebasestorage.app",
  messagingSenderId: "1006559158927",
  appId: "1:1006559158927:web:104b2c64e9700e548d86fa"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
