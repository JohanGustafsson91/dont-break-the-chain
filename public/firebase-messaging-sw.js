// Firebase Cloud Messaging Service Worker
// This handles notifications when the app is in the background

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// These values come from your .env file
firebase.initializeApp({
  apiKey: "${VITE_API_KEY}",
  authDomain: "${VITE_AUTH_DOMAIN}",
  projectId: "${VITE_PROJECT_ID}",
  storageBucket: "${VITE_STORAGE_BUCKET}",
  messagingSenderId: "${VITE_MESSAGING_SENDER_ID}",
  appId: "${VITE_APP_ID}"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Habit Reminder';
  const notificationOptions = {
    body: payload.notification?.body || 'Don\'t forget to log your habits!',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'habit-reminder',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
