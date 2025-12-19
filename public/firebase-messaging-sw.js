importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "${VITE_API_KEY}",
  authDomain: "${VITE_AUTH_DOMAIN}",
  projectId: "${VITE_PROJECT_ID}",
  storageBucket: "${VITE_STORAGE_BUCKET}",
  messagingSenderId: "${VITE_MESSAGING_SENDER_ID}",
  appId: "${VITE_APP_ID}"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Habit Reminder';
  const options = {
    body: payload.notification?.body || 'Don\'t forget to log your habits!',
    icon: '/web-app-manifest-192x192.png',
    badge: '/web-app-manifest-192x192.png',
    tag: 'habit-reminder',
  };

  self.registration.showNotification(title, options);
});
