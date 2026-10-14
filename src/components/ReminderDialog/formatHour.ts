import { getLanguage, getLocale, languageFromBrowser } from "../../i18n/i18n";

// The browser's own locale when it speaks the app's language, so its 12- or 24-hour
// clock is kept (en-GB shows 19:00, not 07 PM); otherwise the app language's default.
export const formatHour = (hour: number) =>
  new Date(2000, 0, 1, hour).toLocaleTimeString(
    languageFromBrowser([navigator.language]) === getLanguage() ? navigator.language : getLocale(),
    { hour: "2-digit", minute: "2-digit" },
  );
