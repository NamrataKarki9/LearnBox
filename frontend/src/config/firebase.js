import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCkBAM9MRKzQwLDLud9g5NKFCkb0WkzZM8",
  authDomain: "learnbox-2dbfc.firebaseapp.com",
  projectId: "learnbox-2dbfc",
  storageBucket: "learnbox-2dbfc.firebasestorage.app",
  messagingSenderId: "421092480810",
  appId: "1:421092480810:web:5e212d83fc5f5ad36bf053",
  measurementId: "G-12YT91MGB0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

export default app;
