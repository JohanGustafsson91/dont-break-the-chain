/// <reference types="vitest" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPCHECK_SITE_KEY?: string;
  readonly VITE_APPCHECK_DEBUG_TOKEN?: string;
}

// eslint-disable-next-line no-var -- Firebase App Check reads this global.
declare var FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string | undefined;
