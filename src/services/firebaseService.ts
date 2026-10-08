import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
export type { User } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);

// Keep getAuth's default popup resolver. On Safari/iOS it preloads Google's sign-in
// scripts on purpose: WebKit only allows a popup shortly after the click, so loading
// them lazily at sign-in risks "popup blocked" on the first attempt.
export const auth = getAuth(app);
export const db = getFirestore();
