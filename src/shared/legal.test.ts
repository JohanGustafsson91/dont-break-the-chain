import { describe, it, expect } from "vitest";
import { LEGAL } from "./legal";

describe("Legal details shown in the privacy policy and terms", () => {
  it("should have a real contact address, not a placeholder", () => {
    expect(LEGAL.contactEmail).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i);
    expect(LEGAL.contactEmail).not.toMatch(/example\.com$/);
  });
});
