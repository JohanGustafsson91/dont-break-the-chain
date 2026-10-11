// The app's language: English or Swedish. "auto" (the default) follows the browser;
// a choice made on the login page or in the account menu is remembered on this device.
//
// Texts live next to the code that shows them, in `messages.ts` files made with
// defineMessages: the Swedish set must have exactly the English set's keys.
import { useSyncExternalStore } from "react";

export type Language = "en" | "sv";
export type LanguageSetting = Language | "auto";

const STORAGE_KEY = "language";
const LOCALES: Record<Language, string> = { en: "en-US", sv: "sv-SE" };

/** The first of the browser's preferred languages that the app speaks, else English. */
export const languageFromBrowser = (preferred: readonly string[]): Language => {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split("-")[0];
    if (base === "sv" || base === "en") return base;
  }
  return "en";
};

const readSetting = (): LanguageSetting => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "en" || stored === "sv" ? stored : "auto";
  } catch {
    // Storage can be blocked (private mode, site data off); follow the browser then.
    return "auto";
  }
};

const browserLanguages = () =>
  typeof navigator === "undefined" ? [] : navigator.languages?.length ? navigator.languages : [navigator.language];

const resolve = (setting: LanguageSetting): Language =>
  setting === "auto" ? languageFromBrowser(browserLanguages()) : setting;

let state = { setting: readSetting(), language: resolve(readSetting()) };
const listeners = new Set<() => void>();

const update = (setting: LanguageSetting) => {
  state = { setting, language: resolve(setting) };
  if (typeof document !== "undefined") document.documentElement.lang = state.language;
  listeners.forEach((listener) => listener());
};

if (typeof document !== "undefined") document.documentElement.lang = state.language;
if (typeof window !== "undefined") {
  window.addEventListener("languagechange", () => {
    if (state.setting === "auto") update("auto");
  });
}

export const setLanguageSetting = (setting: LanguageSetting) => {
  try {
    if (setting === "auto") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, setting);
  } catch {
    // Not remembered, but still used for this visit.
  }
  update(setting);
};

/** For code outside React (domain texts, dates). Components use the hooks, so they re-render. */
export const getLanguage = (): Language => state.language;
export const getLocale = (): string => LOCALES[state.language];

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useLanguage = () => useSyncExternalStore(subscribe, () => state);

type Messages<T> = { en: T; sv: NoInfer<T> };

export const defineMessages = <T extends object>(messages: Messages<T>): Messages<T> => messages;

/** This component's texts in the current language. */
export const useMessages = <T,>(messages: Messages<T>): T => messages[useLanguage().language];

/** The same, for code outside React. */
export const messagesFor = <T,>(messages: Messages<T>): T => messages[state.language];
