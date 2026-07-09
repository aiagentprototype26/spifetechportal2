import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your Spife Clean Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyBYL3BA_2V8i4DYnTVTqVclHTVYTVLQtEA",
  authDomain: "spifeclean-e1def.firebaseapp.com",
  projectId: "spifeclean-e1def",
  storageBucket: "spifeclean-e1def.firebasestorage.app",
  messagingSenderId: "1072125820215",
  appId: "1:1072125820215:web:9737f91bed99446ea92eb2",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
