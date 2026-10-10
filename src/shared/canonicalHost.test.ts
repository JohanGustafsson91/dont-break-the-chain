import { describe, it, expect } from "vitest";
import { canonicalRedirect } from "./canonicalHost";

const at = (hostname: string, pathname = "/", search = "", hash = "") => ({ hostname, pathname, search, hash });

describe("canonicalRedirect - one address for the app", () => {
  it("should send visitors on the old Firebase addresses to the same page on the domain", () => {
    expect(canonicalRedirect(at("dont-break-the-chain-cb8a0.web.app", "/habits/abc", "?x=1", "#y"), "dontbreakthechain.se"))
      .toBe("https://dontbreakthechain.se/habits/abc?x=1#y");
    expect(canonicalRedirect(at("dont-break-the-chain-cb8a0.firebaseapp.com"), "dontbreakthechain.se"))
      .toBe("https://dontbreakthechain.se/");
  });

  it("should stay on the domain itself, and everywhere when no domain is configured", () => {
    expect(canonicalRedirect(at("dontbreakthechain.se", "/privacy"), "dontbreakthechain.se")).toBeUndefined();
    expect(canonicalRedirect(at("localhost"), undefined)).toBeUndefined();
    expect(canonicalRedirect(at("dont-break-the-chain-dev-a6si.web.app"), undefined)).toBeUndefined();
  });
});
