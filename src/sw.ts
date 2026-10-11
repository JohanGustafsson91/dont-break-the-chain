/// <reference lib="webworker" />
// The app's service worker: precaches the app for offline use (as the generated one
// did before) and shows daily reminder notifications sent through Firebase Cloud
// Messaging (FCM).
import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

declare const self: ServiceWorkerGlobalScope;

// registerType "autoUpdate": a new version takes over right away.
self.skipWaiting();
clientsClaim();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), {
    // Firebase's reserved URLs, such as the sign-in handler, must reach the server.
    denylist: [/^\/__\//],
  }),
);

interface FcmPayload {
  notification?: { title?: string; body?: string; click_action?: string };
  fcmOptions?: { link?: string };
}

// Handled here instead of by the Firebase Messaging SDK, which skips the notification
// while the app is open. Every push must show one: Safari can revoke push permission
// for pushes that show nothing.
self.addEventListener("push", (event) => {
  let payload: FcmPayload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    // Not JSON: fall back to the default text below.
  }
  const { notification = {}, fcmOptions = {} } = payload;

  // `renotify` is supported in Chromium but missing from TypeScript's DOM types.
  const options: NotificationOptions & { renotify?: boolean } = {
    body: notification.body,
    icon: "/web-app-manifest-192x192.png",
    // One reminder at a time: a newer one replaces an unread older one, and still
    // alerts (without renotify, a replacement arrives silently).
    tag: "daily-reminder",
    renotify: true,
    data: { link: fcmOptions.link ?? notification.click_action ?? "/" },
  };

  event.waitUntil(
    self.registration.showNotification(notification.title ?? "Don't Break The Chain", options),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.link ?? "/", self.location.origin);
  // Only ever open this app.
  if (url.origin !== self.location.origin) return;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((client) => new URL(client.url).origin === url.origin);
      if (open) {
        await open.focus();
        if (open.url !== url.href) await open.navigate(url.href);
        return;
      }
      await self.clients.openWindow(url.href);
    })(),
  );
});
