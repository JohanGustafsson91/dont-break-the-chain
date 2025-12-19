import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebaseService";
import { COLLECTIONS } from "../shared/constants";

const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY;

const isNotificationSupported = (): boolean =>
  "Notification" in window;

const isPermissionGranted = (): boolean =>
  Notification.permission === "granted";

const saveFCMToken = async (): Promise<void> => {
  try {
    if (!VAPID_KEY || !auth.currentUser) return;

    const messaging = getMessaging();
    
    if (!("serviceWorker" in navigator)) return;
    
    await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const swRegistration = await navigator.serviceWorker.ready;
    
    const token = await getToken(messaging, { 
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration
    });

    if (!token) return;

    const tokenRef = doc(db, COLLECTIONS.FCM_TOKENS, token);
    await setDoc(tokenRef, {
      userId: auth.currentUser.uid,
      token,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving FCM token:", error);
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  if (isPermissionGranted()) {
    await saveFCMToken();
    return true;
  }
  if (Notification.permission === "denied") return false;

  const permission = await Notification.requestPermission();
  const granted = permission === "granted";
  
  if (granted) await saveFCMToken();
  
  return granted;
};

export const areNotificationsEnabled = (): boolean =>
  isNotificationSupported() && isPermissionGranted();

const showNotification = (title: string, body: string): void => {
  if (!areNotificationsEnabled()) return;

  const notificationOptions = {
    body,
    icon: "/web-app-manifest-192x192.png",
    badge: "/web-app-manifest-192x192.png",
    tag: "habit-reminder",
  };

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((registration) =>
      registration.showNotification(title, notificationOptions)
    );
    return;
  }

  new Notification(title, notificationOptions);
};

export const initializeNotifications = async (): Promise<void> => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const messaging = getMessaging();
  onMessage(messaging, (payload) => {
    const title = payload.notification?.title;
    const body = payload.notification?.body;
    
    if (title && body) showNotification(title, body);
  });
};
