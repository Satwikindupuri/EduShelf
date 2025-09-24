import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDuQwmUmiC7cGs7ezlS0gfjv8xZY_g_Ffg",
  authDomain: "edushelf-4b5d6.firebaseapp.com",
  projectId: "edushelf-4b5d6",
  storageBucket: "edushelf-4b5d6.firebasestorage.app",
  messagingSenderId: "872609770677",
  appId: "1:872609770677:web:16c8c12260cab2332ce2fc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
