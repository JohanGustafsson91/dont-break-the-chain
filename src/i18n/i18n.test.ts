import { describe, it, expect, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  defineMessages,
  getLanguage,
  getLocale,
  languageFromBrowser,
  messagesFor,
  setLanguageSetting,
  useMessages,
} from "./i18n";

const greetings = defineMessages({
  en: { hello: "Hello", days: (n: number) => `${n} ${n === 1 ? "day" : "days"}` },
  sv: { hello: "Hej", days: (n: number) => `${n} ${n === 1 ? "dag" : "dagar"}` },
});

describe("i18n", () => {
  afterEach(() => setLanguageSetting("auto"));

  it("should pick the first preferred language the app speaks, else English", () => {
    expect(languageFromBrowser(["sv-SE", "en-US"])).toBe("sv");
    expect(languageFromBrowser(["nb-NO", "sv", "en"])).toBe("sv");
    expect(languageFromBrowser(["en-GB", "sv-SE"])).toBe("en");
    expect(languageFromBrowser(["de-DE", "fi"])).toBe("en");
    expect(languageFromBrowser([])).toBe("en");
  });

  it("should follow the browser by default and remember a choice on this device", () => {
    // jsdom's browser language is English.
    expect(getLanguage()).toBe("en");

    setLanguageSetting("sv");
    expect(getLanguage()).toBe("sv");
    expect(getLocale()).toBe("sv-SE");
    expect(document.documentElement.lang).toBe("sv");
    expect(localStorage.getItem("language")).toBe("sv");
    expect(messagesFor(greetings).days(2)).toBe("2 dagar");

    setLanguageSetting("auto");
    expect(getLanguage()).toBe("en");
    expect(localStorage.getItem("language")).toBeNull();
  });

  it("should re-render components when the language changes", () => {
    const { result } = renderHook(() => useMessages(greetings));
    expect(result.current.hello).toBe("Hello");

    act(() => setLanguageSetting("sv"));

    expect(result.current.hello).toBe("Hej");
  });
});
