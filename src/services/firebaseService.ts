import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
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

// App Check lets Firebase reject requests that don't come from this app, which
// protects the shared Spark quotas. Without a site key (tests, a fresh checkout)
// the app runs without it. It is off for now: before adding a key, the privacy
// policy must name reCAPTCHA (see PR 5b in docs/production-readiness.md).
const appCheckSiteKey = import.meta.env.VITE_APPCHECK_SITE_KEY;
if (appCheckSiteKey) {
  if (import.meta.env.DEV) {
    // On localhost, a debug token registered in the Firebase console replaces reCAPTCHA.
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN || true;
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

// Keep getAuth's default popup resolver. On Safari/iOS it preloads Google's sign-in
// scripts on purpose: WebKit only allows a popup shortly after the click, so loading
// them lazily at sign-in risks "popup blocked" on the first attempt.
export const auth = getAuth(app);
export const db = getFirestore();
