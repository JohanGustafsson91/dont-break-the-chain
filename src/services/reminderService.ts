import {
  arrayRemove,
  arrayUnion,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { deleteToken, getMessaging, getToken, isSupported } from "firebase/messaging";
import { app, auth, db } from "./firebaseService";
import { getToday } from "../utils/date";
import { isEverythingDoneToday, type Habit } from "../domain/Habit";
import { getAllHabits } from "./habitService";

// One document per user (id = uid). See firestore.rules for its shape.
const COLLECTION = "reminders";
// This device's push token, so it can be removed again on "off", log out or a new token.
const DEVICE_TOKEN_KEY = "reminderToken";
const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY;

export const DEFAULT_REMINDER_HOUR = 20;

// What recordTodayProgress last saved (or found no reminders for), to skip repeats.
let lastRecorded: { day: string; done: boolean } | undefined;

/** Reminders need a Web Push key for the Firebase project; without one they are hidden. */
export const remindersAvailable = Boolean(VAPID_KEY);

export interface ReminderSettings {
  hour: number;
  timeZone: string;
  tokens: string[];
  /** The last day on which every habit was done (see isEverythingDoneToday). */
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

// Updating a missing reminders document is checked by the rules as an update to an
// incomplete document, so a user without reminders gets permission-denied, not
// not-found.
const hasNoReminders = (error: unknown) =>
  isNotFound(error) || (error as { code?: string })?.code === "permission-denied";

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
  lastRecorded = undefined;
  // So a day that is already done doesn't get a reminder.
  void refreshTodayProgress();
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
    if (!hasNoReminders(error)) throw error;
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
  lastRecorded = undefined;
  if (!storage.get()) return;

  await withTimeout(turnOffRemindersOnThisDevice(), 3000).catch((error) => {
    console.warn("Could not remove this device from reminders", { error });
  });
  await forgetLocalToken();
};

export const deleteReminders = async () => {
  await deleteDoc(reminderDoc());
  lastRecorded = undefined;
  await forgetLocalToken();
};


/**
 * Lets the reminder sender skip users who have nothing left to do today, without the
 * sender ever reading habits. Saves today's date once everything is done, and clears
 * it if something is undone again. Writes only when that changes. Users without
 * reminders have no document, so the update is denied (see hasNoReminders), which is fine.
 * Never throws: it must not affect saving the day itself.
 */
export const recordTodayProgress = async (habits: Habit[]) => {
  if (!auth.currentUser) return;
  const today = getToday();
  // Calendar days are UTC midnights of the local date, so this is the local YYYY-MM-DD.
  const day = today.toISOString().slice(0, 10);
  const done = isEverythingDoneToday(habits, today);
  if (lastRecorded?.day === day && lastRecorded.done === done) return;

  // Set before the write: a quick ✓ then undo must not be skipped while the first
  // write is still on its way. One client's writes arrive in order, so the last wins.
  lastRecorded = { day, done };
  try {
    await updateDoc(reminderDoc(), { lastMarkedDate: done ? day : deleteField() });
  } catch (error) {
    if (hasNoReminders(error)) return;
    lastRecorded = undefined;
    console.warn("Could not record today's progress for reminders", { error });
  }
};

/** For views that don't have every habit at hand, such as a single habit's page. */
export const refreshTodayProgress = async () => {
  if (!auth.currentUser) return;
  try {
    await recordTodayProgress(await getAllHabits());
  } catch (error) {
    console.warn("Could not record today's progress for reminders", { error });
  }
};
