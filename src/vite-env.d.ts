/// <reference types="vitest" />
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_APPCHECK_SITE_KEY?: string;
  readonly VITE_APPCHECK_DEBUG_TOKEN?: string;
  readonly VITE_FCM_VAPID_KEY?: string;
  readonly VITE_E2E?: string;
  /** Production only: the app's own domain; other hosts redirect there. */
  readonly VITE_CANONICAL_HOST?: string;
}

// eslint-disable-next-line no-var -- Firebase App Check reads this global.
declare var FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string | undefined;
