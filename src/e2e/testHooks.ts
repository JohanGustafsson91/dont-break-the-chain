// Only in builds made for the end-to-end tests (VITE_E2E=true, see playwright.config.ts);
// production builds never include this file. Real Google and GitHub sign-in can't be
// automated reliably, so the tests sign in to a test account with email and password,
// which only the dev Firebase project allows.
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { deleteDoc, doc, setDoc, waitForPendingWrites } from "firebase/firestore";
import { auth, db } from "../services/firebaseService";
import { deleteAllHabits } from "../services/habitService";

export interface E2eHooks {
  signIn: (email: string, password: string) => Promise<void>;
  /** Resolves once the saved session has been restored: true if someone is signed in. */
  whenSignedIn: () => Promise<boolean>;
  /** Deletes the signed-in test account's habits and reminder settings. */
  reset: () => Promise<void>;
  /** Resolves once every save has reached the server, so a reload can't drop it. */
  waitForWrites: () => Promise<void>;
  /** Stores reminder settings with a fake device token, as if reminders were on. */
  seedReminder: () => Promise<void>;
}

declare global {
  interface Window {
    __e2e?: E2eHooks;
  }
}

window.__e2e = {
  signIn: async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  },
  whenSignedIn: () =>
    new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(Boolean(user));
      });
    }),
  reset: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Not signed in");
    await deleteAllHabits();
    await deleteDoc(doc(db, "reminders", uid));
  },
  waitForWrites: () => waitForPendingWrites(db),
  seedReminder: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Not signed in");
    await setDoc(doc(db, "reminders", uid), {
      hour: 20,
      timeZone: "Europe/Stockholm",
      tokens: ["fake-device-token-for-e2e"],
    });
  },
};
