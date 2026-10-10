import { describe, it, expect, vi, onTestFinished } from "vitest";
import { isDeadToken, localTime, reminderBody, reminderDue, sendReminders } from "./send-reminders.mjs";

const STOCKHOLM = "Europe/Stockholm";
// 18:05 UTC on 9 October 2026 is 20:05 in Stockholm (summer time).
const NOW = new Date("2026-10-09T18:05:00Z");
const base = { hour: 20, timeZone: STOCKHOLM, tokens: ["device-a"] };

const doc = (name: string, fields: object) => ({ name, fields });
const firestoreFields = (s: Record<string, unknown>) => ({
  ...(s.hour !== undefined && { hour: { integerValue: String(s.hour) } }),
  ...(s.timeZone !== undefined && { timeZone: { stringValue: s.timeZone } }),
  tokens: { arrayValue: { values: (s.tokens as string[]).map((t) => ({ stringValue: t })) } },
  ...(s.lastMarkedDate !== undefined && { lastMarkedDate: { stringValue: s.lastMarkedDate } }),
  ...(s.lastRemindedDate !== undefined && { lastRemindedDate: { stringValue: s.lastRemindedDate } }),
});

const fakeApi = (docs: ReturnType<typeof doc>[], send = vi.fn().mockResolvedValue("sent")) => ({
  reminders: async function* () {
    yield* docs;
  },
  send,
  update: vi.fn().mockResolvedValue(undefined),
});

describe("send-reminders - who gets a reminder", () => {
  it("should work out the local date and hour in the user's time zone", () => {
    expect(localTime(NOW, STOCKHOLM)).toEqual({ date: "2026-10-09", hour: 20 });
    expect(localTime(NOW, "Pacific/Auckland")).toEqual({ date: "2026-10-10", hour: 7 });
    expect(localTime(NOW, "America/New_York")).toEqual({ date: "2026-10-09", hour: 14 });
  });

  it("should remind from the chosen hour, catch up two hours, and then stop", () => {
    expect(reminderDue({ ...base, hour: 21 }, NOW).due).toBe(false); // not yet
    expect(reminderDue(base, NOW)).toEqual({ due: true, date: "2026-10-09" });
    expect(reminderDue({ ...base, hour: 18 }, NOW).due).toBe(true); // a delayed run catches up
    expect(reminderDue({ ...base, hour: 17 }, NOW).due).toBe(false); // too late to surprise anyone
  });

  it("should skip days that are already marked or already reminded", () => {
    expect(reminderDue({ ...base, lastMarkedDate: "2026-10-09" }, NOW).due).toBe(false);
    expect(reminderDue({ ...base, lastRemindedDate: "2026-10-09" }, NOW).due).toBe(false);
    expect(reminderDue({ ...base, lastMarkedDate: "2026-10-08" }, NOW).due).toBe(true);
  });

  it("should skip documents without devices or with broken settings", () => {
    expect(reminderDue({ ...base, tokens: [] }, NOW).due).toBe(false);
    expect(reminderDue({ ...base, hour: undefined }, NOW).due).toBe(false);
    expect(() => reminderDue({ ...base, timeZone: "Not/AZone" }, NOW)).toThrow(RangeError);
  });
});

describe("send-reminders - a run", () => {
  it("should send to every device, remove dead tokens, and remember the day", async () => {
    const send = vi.fn(async (token: string) => (token === "dead" ? "dead" : "sent"));
    const api = fakeApi([doc("reminders/u1", firestoreFields({ ...base, tokens: ["a", "dead", "b"] }))], send);

    const counts = await sendReminders({ api, now: NOW, link: "https://app", dryRun: false });

    const body = "Some habits aren't marked yet. Keep your chain going.";
    expect(send.mock.calls).toEqual([
      ["a", "https://app", body],
      ["dead", "https://app", body],
      ["b", "https://app", body],
    ]);
    expect(api.update).toHaveBeenCalledWith("reminders/u1", {
      remindedDate: "2026-10-09",
      deadTokens: ["dead"],
    });
    expect(counts).toEqual({ checked: 1, due: 1, sent: 2, deadTokens: 1, failed: 0 });
  });

  it("should keep going when one user's document is broken", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    onTestFinished(() => warn.mockRestore());
    const api = fakeApi([
      doc("reminders/bad", firestoreFields({ ...base, timeZone: "Not/AZone" })),
      doc("reminders/good", firestoreFields(base)),
    ]);

    const counts = await sendReminders({ api, now: NOW, link: "https://app", dryRun: false });

    expect(counts).toMatchObject({ checked: 2, due: 1, sent: 1, failed: 1 });
    expect(api.update).toHaveBeenCalledWith("reminders/good", expect.anything());
  });

  it("should send and write nothing in a dry run", async () => {
    const api = fakeApi([doc("reminders/u1", firestoreFields(base))]);

    const counts = await sendReminders({ api, now: NOW, link: "https://app", dryRun: true });

    expect(counts).toMatchObject({ checked: 1, due: 1, sent: 0 });
    expect(api.send).not.toHaveBeenCalled();
    expect(api.update).not.toHaveBeenCalled();
  });
});

describe("send-reminders - FCM errors", () => {
  // Real FCM v1 error bodies, captured from the dev project.
  const fcmError = (errorCode: string) => ({
    "@type": "type.googleapis.com/google.firebase.fcm.v1.FcmError",
    errorCode,
  });
  const malformedToken = {
    status: "INVALID_ARGUMENT",
    message: "The registration token is not a valid FCM registration token",
    details: [
      fcmError("INVALID_ARGUMENT"),
      {
        "@type": "type.googleapis.com/google.rpc.BadRequest",
        fieldViolations: [{ field: "message.token", description: "not a valid FCM registration token" }],
      },
    ],
  };

  it("should only drop tokens that FCM says can never work again", () => {
    expect(isDeadToken({ status: "NOT_FOUND", details: [fcmError("UNREGISTERED")] })).toBe(true);
    expect(isDeadToken({ status: "PERMISSION_DENIED", details: [fcmError("SENDER_ID_MISMATCH")] })).toBe(true);
    expect(isDeadToken(malformedToken)).toBe(true);

    // Temporary or configuration problems never delete tokens.
    expect(isDeadToken({ status: "UNAVAILABLE", details: [fcmError("UNAVAILABLE")] })).toBe(false);
    expect(isDeadToken({ status: "RESOURCE_EXHAUSTED", details: [fcmError("QUOTA_EXCEEDED")] })).toBe(false);
    expect(isDeadToken({ status: "UNAUTHENTICATED", details: [fcmError("THIRD_PARTY_AUTH_ERROR")] })).toBe(false);
    expect(isDeadToken({ status: "NOT_FOUND", message: "Requested entity was not found." })).toBe(false);
    expect(isDeadToken({ status: "INVALID_ARGUMENT", details: [fcmError("INVALID_ARGUMENT")] })).toBe(false);
  });

  it("should still remember the day when one device fails for a moment", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    onTestFinished(() => warn.mockRestore());
    const send = vi.fn(async (token: string) => {
      if (token === "busy") throw Object.assign(new Error("HTTP 503"), { body: {} });
      return token === "dead" ? "dead" : "sent";
    });
    const api = fakeApi([doc("reminders/u1", firestoreFields({ ...base, tokens: ["a", "busy", "dead"] }))], send);

    const counts = await sendReminders({ api, now: NOW, link: "https://app", dryRun: false });

    expect(counts).toMatchObject({ sent: 1, deadTokens: 1, failed: 1 });
    expect(api.update).toHaveBeenCalledWith("reminders/u1", {
      remindedDate: "2026-10-09",
      deadTokens: ["dead"],
    });
    expect(warn).toHaveBeenCalledWith("A reminder failed:", "HTTP 503");
  });

  it("should leave the day open for a retry when every device fails for a moment", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    onTestFinished(() => vi.mocked(console.warn).mockRestore());
    const send = vi.fn().mockRejectedValue(Object.assign(new Error("HTTP 503"), { body: {} }));
    const api = fakeApi([doc("reminders/u1", firestoreFields(base))], send);

    await sendReminders({ api, now: NOW, link: "https://app", dryRun: false });

    expect(api.update).not.toHaveBeenCalled();
  });

  it("should never log a user's time zone", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    onTestFinished(() => warn.mockRestore());
    const api = fakeApi([doc("reminders/u1", firestoreFields({ ...base, timeZone: "Secret/Zone" }))]);

    await sendReminders({ api, now: NOW, link: "https://app", dryRun: false });

    expect(JSON.stringify(warn.mock.calls)).not.toContain("Secret");
  });
});

describe("send-reminders - the notification text", () => {
  const today = "2026-10-10";
  const p = (date: string, left: number, total: number, openChain = 0, doneChain = 0) => ({ date, left, total, openChain, doneChain });

  it("should say how much is left today, and name the chain at stake", () => {
    expect(reminderBody(p(today, 2, 5, 12), today)).toBe("2 of 5 habits left today. Keep your 12-day chain going 🔗");
    expect(reminderBody(p(today, 1, 4), today)).toBe("One habit left today. Finish the day ✅");
    expect(reminderBody(p(today, 1, 4, 9), today)).toBe("One habit left today. Keep your 9-day chain going 🔗");
    expect(reminderBody(p(today, 3, 3, 2), today)).toBe("All 3 habits are waiting. Keep your chain going.");
    expect(reminderBody(p(today, 1, 1), today)).toBe("Today isn't marked yet. Finish the day ✅");
  });

  it("should use yesterday's counts when the app wasn't opened today", () => {
    // Everything waits today; the chains done yesterday are the ones still open.
    expect(reminderBody(p("2026-10-09", 0, 4, 0, 15), today)).toBe("All 4 habits are waiting. Keep your 15-day chain going 🔗");
    expect(reminderBody(p("2026-10-09", 0, 1, 0, 0), today)).toBe("Today isn't marked yet. Finish the day ✅");
  });

  it("should stay general without fresh counts", () => {
    expect(reminderBody(p("2026-10-01", 2, 5, 30, 30), today)).toBe("Some habits aren't marked yet. Keep your chain going.");
    expect(reminderBody(undefined, today)).toBe("Some habits aren't marked yet. Keep your chain going.");
  });
});
