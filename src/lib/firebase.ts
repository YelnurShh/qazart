// Firebase инициализациясы тек Auth пен Firestore үшін
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBta_hyspKiKKUetA90S8iT3U4tesiOKlQ",
  authDomain: "qazaqsha-6afd9.firebaseapp.com",
  projectId: "qazaqsha-6afd9",
  storageBucket: "qazaqsha-6afd9.firebasestorage.app",
  messagingSenderId: "710183071663",
  appId: "1:710183071663:web:806f9668778f06ffcc095a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage();   
