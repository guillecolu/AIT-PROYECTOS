
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "machinetrack-uauk1",
  "appId": "1:1006559158927:web:104b2c64e9700e548d86fa",
  "storageBucket": "machinetrack-uauk1.firebasestorage.app",
  "apiKey": "AIzaSyAgBarQePktzbwTE4wVDzgZ1ahyNgHT2Zc",
  "authDomain": "machinetrack-uauk1.firebaseapp.com",
  "messagingSenderId": "1006559158927"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
