import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD_QncZb8F3a1SYa97TBWKtqWmbZKBgKXc",
  authDomain: "filipinoemigrantsdb-3c383.firebaseapp.com",
  projectId: "filipinoemigrantsdb-3c383",
  storageBucket: "filipinoemigrantsdb-3c383.firebasestorage.app",
  messagingSenderId: "55580091125",
  appId: "1:55580091125:web:ee5e103f86fed7c2b11bbc"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
