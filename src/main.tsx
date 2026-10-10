import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Self-hosted fonts: loading them from Google Fonts would send visitors' IPs to Google.
import "@fontsource-variable/dm-sans/opsz.css";
import "@fontsource/victor-mono/latin-400.css";
import "@fontsource/victor-mono/latin-500.css";
import "@fontsource/victor-mono/latin-600.css";
import "./index.css";
import { App } from "./components/App/App.tsx";
import { registerSW } from "virtual:pwa-register";
import { canonicalRedirect } from "./shared/canonicalHost";

// One address for everyone: sessions, installs and reminders belong to an address.
const redirectTo = canonicalRedirect(window.location, import.meta.env.VITE_CANONICAL_HOST);
if (redirectTo) window.location.replace(redirectTo);

// Removed from every build except the end-to-end test build.
if (import.meta.env.VITE_E2E === "true") void import("./e2e/testHooks");

// A new version installs in the background and then reloads the page (registerType
// "autoUpdate"). An installed app on a phone is usually resumed rather than reopened,
// so the browser may never look for a new version; look whenever the app comes back.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") void registration.update();
    });
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
