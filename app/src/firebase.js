import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyApqfWtM_62QzW6580_rdvh_XJgaFNQVII",
  authDomain: "interview-prep-313b4.firebaseapp.com",
  projectId: "interview-prep-313b4",
  storageBucket: "interview-prep-313b4.firebasestorage.app",
  messagingSenderId: "935803642181",
  appId: "1:935803642181:web:8dd5b6b120d23919779e2c",
  measurementId: "G-5SYD59L75X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
