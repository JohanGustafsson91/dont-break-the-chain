import {
  arrayRemove,
  arrayUnion,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { deleteToken, getMessaging, getToken, isSupported } from "firebase/messaging";
import { app, auth, db } from "./firebaseService";
import { HABIT_STATUS } from "../shared/constants";
import { getToday, isSameDay } from "../utils/date";
import type { StreakDay } from "../domain/Habit";

// One document per user (id = uid). See firestore.rules for its shape.
const COLLECTION = "reminders";
// This device's push token, so it can be removed again on "off", log out or a new token.
const DEVICE_TOKEN_KEY = "reminderToken";
const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY;

export const DEFAULT_REMINDER_HOUR = 20;

// The last day recordMarkedToday saved (or found no reminders for), to skip repeats.
let lastRecordedDay: string | undefined;

/** Reminders need a Web Push key for the Firebase project; without one they are hidden. */
export const remindersAvailable = Boolean(VAPID_KEY);

export interface ReminderSettings {
  hour: number;
  timeZone: string;
  tokens: string[];
  lastMarkedDate?: string;
  /** Written by the sender, so a reminder goes out at most once a day. */
  lastRemindedDate?: string;
}

const reminderDoc = () => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  return doc(db, COLLECTION, uid);
};

const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const storage = {
  get: () => {
    try {
      return localStorage.getItem(DEVICE_TOKEN_KEY) ?? undefined;
    } catch {
      return undefined;
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(DEVICE_TOKEN_KEY, token);
    } catch {
      // Without storage the token can't be removed later; the sender drops dead tokens.
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(DEVICE_TOKEN_KEY);
    } catch {
      // Nothing to clear.
    }
  },
};

const isNotFound = (error: unknown) => (error as { code?: string })?.code === "not-found";

// Firestore writes wait for the server, so offline they would never settle. Used where
// a reminder clean-up must not hold up something else, such as logging out.
const withTimeout = <T>(promise: Promise<T>, ms: number) =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timed out")), ms)),
  ]);

export type ReminderSupport = "supported" | "needs-install" | "unsupported";

export const getReminderSupport = async (): Promise<ReminderSupport> => {
  if (await isSupported()) return "supported";
  // iPhone and iPad only offer push notifications to apps added to the Home Screen.
  const isAppleMobile =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);
  return isAppleMobile ? "needs-install" : "unsupported";
};

export const getReminderSettings = async (): Promise<ReminderSettings | undefined> => {
  const snapshot = await getDoc(reminderDoc());
  return snapshot.exists() ? (snapshot.data() as ReminderSettings) : undefined;
};

export const isOnForThisDevice = (settings: ReminderSettings | undefined) => {
  const token = storage.get();
  return Boolean(token && settings?.tokens.includes(token));
};

export class NotificationsBlockedError extends Error {}

/**
 * Asks for permission (call it straight from a tap: Safari requires that), then saves
 * this device's push token together with the hour and the current time zone.
 */
export const turnOnReminders = async (hour: number) => {
  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new NotificationsBlockedError();
  }

  const token = await currentDeviceToken();
  await replaceStoredToken(token);
  await setDoc(
    reminderDoc(),
    { hour, timeZone: timeZone(), tokens: arrayUnion(token) },
    { merge: true },
  );
  storage.set(token);
  lastRecordedDay = undefined;
};

const currentDeviceToken = async () =>
  getToken(getMessaging(app), {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: await navigator.serviceWorker.ready,
  });

// Removes this device's previous token first, so the 10-token cap never blocks a swap.
const replaceStoredToken = async (token: string) => {
  const previous = storage.get();
  if (!previous || previous === token) return;
  await removeToken(previous);
};

const removeToken = async (token: string) => {
  try {
    await updateDoc(reminderDoc(), { tokens: arrayRemove(token) });
  } catch (error) {
    if (!isNotFound(error)) throw error;
  }
};

/**
 * FCM rotates push tokens now and then. Called on app start, so a rotated token
 * replaces the old one before reminders silently stop.
 */
export const syncReminderToken = async () => {
  try {
    if (!remindersAvailable || !storage.get()) return;
    if (!(await isSupported()) || Notification.permission !== "granted") return;

    const token = await currentDeviceToken();
    if (token === storage.get()) return;
    await replaceStoredToken(token);
    await updateDoc(reminderDoc(), { tokens: arrayUnion(token) });
    storage.set(token);
  } catch (error) {
    console.warn("Could not refresh the reminder token", { error });
  }
};

/** The hour applies to every device; the time zone follows the device that saved it. */
export const updateReminderHour = (hour: number) =>
  updateDoc(reminderDoc(), { hour, timeZone: timeZone() });

/**
 * Stops reminders on this device only. When no device is left, the settings go too,
 * so nothing more is stored or updated for a feature that is off everywhere.
 */
export const turnOffRemindersOnThisDevice = async () => {
  const token = storage.get();
  if (!token) return;

  await removeToken(token);
  const settings = await getReminderSettings();
  if (settings && settings.tokens.length === 0) await deleteDoc(reminderDoc());
  await forgetLocalToken();
};

// Deleting the token also makes it useless if it is still stored in Firestore, for
// example after an offline log out; the sender then drops it.
const forgetLocalToken = async () => {
  storage.clear();
  if (await isSupported()) {
    await withTimeout(deleteToken(getMessaging(app)), 3000).catch(() => {});
  }
};

/** Best effort, so logging out still works offline or without permission. */
export const forgetThisDevice = async () => {
  lastRecordedDay = undefined;
  if (!storage.get()) return;

  await withTimeout(turnOffRemindersOnThisDevice(), 3000).catch((error) => {
    console.warn("Could not remove this device from reminders", { error });
  });
  await forgetLocalToken();
};

export const deleteReminders = async () => {
  await deleteDoc(reminderDoc());
  lastRecordedDay = undefined;
  await forgetLocalToken();
};


/**
 * Lets the reminder sender skip users who already marked a habit today. Only a ✓ or ✗
 * for today counts. Users without reminders have no document, so the update fails with
 * not-found, which is fine. Never throws: it must not affect saving the day itself.
 */
export const recordDayMarked = async (date: Date, status: StreakDay["status"]) => {
  const today = getToday();
  if (status === HABIT_STATUS.NOT_SPECIFIED || !isSameDay(date, today)) return;

  // Calendar days are UTC midnights of the local date, so this is the local YYYY-MM-DD.
  const day = today.toISOString().slice(0, 10);
  if (day === lastRecordedDay) return;
  try {
    await updateDoc(reminderDoc(), { lastMarkedDate: day });
    lastRecordedDay = day;
  } catch (error) {
    if (isNotFound(error)) {
      lastRecordedDay = day;
      return;
    }
    console.warn("Could not record today's mark for reminders", { error });
  }
};
