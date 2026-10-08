import { describe, it, expect } from "vitest";
import { LEGAL } from "./legal";

describe("Legal details shown in the privacy policy and terms", () => {
  it("should not ship a placeholder contact address", () => {
    expect(LEGAL.contactEmail).not.toMatch(/example\.com$/);
  });
});
