/**
 * Notification Service with Firebase Cloud Messaging (FCM)
 * Handles push notification permissions and FCM token management
 */

import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebaseService";

const COLLECTIONS = {
  FCM_TOKENS: "fcmTokens",
};

// Your Firebase Cloud Messaging VAPID key (public key)
// Get this from: Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY;

/**
 * Request notification permission and get FCM token
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    await saveFCMToken();
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await saveFCMToken();
      return true;
    }
  }

  return false;
};

/**
 * Get FCM token and save to Firestore
 */
const saveFCMToken = async (): Promise<void> => {
  try {
    const messaging = getMessaging();
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });

    if (token && auth.currentUser) {
      const userId = auth.currentUser.uid;
      const tokenRef = doc(db, COLLECTIONS.FCM_TOKENS, token);

      await setDoc(tokenRef, {
        userId,
        token,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("FCM token saved successfully");
    }
  } catch (error) {
    console.error("Error getting FCM token:", error);
  }
};

/**
 * Check if notifications are currently enabled
 */
export const areNotificationsEnabled = (): boolean => {
  return "Notification" in window && Notification.permission === "granted";
};

/**
 * Initialize FCM and listen for foreground messages
 */
export const initializeNotifications = async (): Promise<void> => {
  const hasPermission = await requestNotificationPermission();

  if (!hasPermission) {
    console.log("Notification permission denied");
    return;
  }

  // Listen for foreground messages
  const messaging = getMessaging();
  onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);

    if (payload.notification) {
      const { title, body } = payload.notification;
      if (title && body) {
        showNotification(title, body);
      }
    }
  });

  console.log("FCM initialized successfully");
};

/**
 * Show a notification (for foreground messages)
 */
const showNotification = (title: string, body: string): void => {
  if (!areNotificationsEnabled()) {
    return;
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body,
        icon: "/icon.svg",
        badge: "/icon.svg",
        tag: "habit-reminder",
        requireInteraction: false,
      });
    });
  } else {
    new Notification(title, {
      body,
      icon: "/icon.svg",
      tag: "habit-reminder",
    });
  }
};
