import { describe, it, expect, vi, beforeEach, onTestFinished } from "vitest";
import * as firestore from "firebase/firestore";
import * as messaging from "firebase/messaging";
import type { DocumentReference, DocumentSnapshot } from "firebase/firestore";

vi.mock("firebase/firestore");
vi.mock("firebase/messaging");
vi.mock("./firebaseService", () => ({ app: {}, auth: { currentUser: { uid: "user-1" } }, db: {} }));

const notFound = () => Object.assign(new Error("not-found"), { code: "not-found" });
const snapshot = (data?: object) =>
  ({ exists: () => Boolean(data), data: () => data }) as unknown as DocumentSnapshot;
const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

// Fresh module state (the "last recorded day" cache) for every test.
const load = async () => {
  vi.resetModules();
  return import("./reminderService");
};

describe("reminderService - daily reminder settings", () => {
  beforeEach(() => {
    // Reset, not just clear: a mockRejectedValue must not leak into the next test.
    vi.resetAllMocks();
    vi.useRealTimers();
    localStorage.clear();
    vi.mocked(firestore.doc).mockReturnValue("reminder-doc" as unknown as DocumentReference);
    vi.mocked(firestore.arrayUnion).mockImplementation((...v) => ({ union: v }) as never);
    vi.mocked(firestore.arrayRemove).mockImplementation((...v) => ({ remove: v }) as never);
    vi.mocked(messaging.getToken).mockResolvedValue("token-new");
    vi.mocked(messaging.deleteToken).mockResolvedValue(true);
    vi.mocked(messaging.isSupported).mockResolvedValue(true);
    vi.stubGlobal("Notification", { permission: "default", requestPermission: vi.fn() });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { ready: Promise.resolve({ scope: "/" }) },
    });
  });

  it("should record a ✓ or ✗ for today once, as the local date, and ignore other days", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 9, 23, 30)); // late evening, local time
    const { recordDayMarked } = await load();

    await recordDayMarked(day("2026-10-08"), "GOOD"); // yesterday
    await recordDayMarked(day("2026-10-09"), "NOT_SPECIFIED"); // unmarking
    expect(firestore.updateDoc).not.toHaveBeenCalled();

    await recordDayMarked(day("2026-10-09"), "BAD");
    await recordDayMarked(day("2026-10-09"), "GOOD");
    expect(firestore.updateDoc).toHaveBeenCalledTimes(1);
    expect(firestore.updateDoc).toHaveBeenCalledWith("reminder-doc", { lastMarkedDate: "2026-10-09" });
  });

  it("should not fail or retry all day when the user has no reminders", async () => {
    vi.mocked(firestore.updateDoc).mockRejectedValue(notFound());
    const { recordDayMarked } = await load();
    const today = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));

    await expect(recordDayMarked(today, "GOOD")).resolves.toBeUndefined();
    await recordDayMarked(today, "GOOD");
    expect(firestore.updateDoc).toHaveBeenCalledTimes(1);
  });

  it("should save nothing when the user doesn't allow notifications", async () => {
    vi.mocked(Notification.requestPermission).mockResolvedValue("denied");
    const { turnOnReminders, NotificationsBlockedError } = await load();

    await expect(turnOnReminders(20)).rejects.toBeInstanceOf(NotificationsBlockedError);
    expect(firestore.setDoc).not.toHaveBeenCalled();
  });

  it("should save this device's token with the hour and time zone, replacing its old token", async () => {
    vi.mocked(Notification.requestPermission).mockResolvedValue("granted");
    localStorage.setItem("reminderToken", "token-old");
    const { turnOnReminders, isOnForThisDevice } = await load();

    await turnOnReminders(7);

    expect(firestore.setDoc).toHaveBeenCalledWith(
      "reminder-doc",
      {
        hour: 7,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        tokens: { union: ["token-new"] },
      },
      { merge: true },
    );
    expect(firestore.updateDoc).toHaveBeenCalledWith("reminder-doc", {
      tokens: { remove: ["token-old"] },
    });
    expect(isOnForThisDevice({ hour: 7, timeZone: "UTC", tokens: ["token-new"] })).toBe(true);
    expect(isOnForThisDevice({ hour: 7, timeZone: "UTC", tokens: ["token-old"] })).toBe(false);
  });

  it("should turn off only this device, and drop the settings when no device is left", async () => {
    localStorage.setItem("reminderToken", "token-a");
    vi.mocked(firestore.getDoc).mockResolvedValueOnce(
      snapshot({ hour: 20, timeZone: "UTC", tokens: ["token-b"] }),
    );
    const { turnOffRemindersOnThisDevice } = await load();

    await turnOffRemindersOnThisDevice();
    expect(firestore.updateDoc).toHaveBeenCalledWith("reminder-doc", {
      tokens: { remove: ["token-a"] },
    });
    expect(firestore.deleteDoc).not.toHaveBeenCalled(); // another device still has them
    expect(localStorage.getItem("reminderToken")).toBeNull();
    expect(messaging.deleteToken).toHaveBeenCalled();

    localStorage.setItem("reminderToken", "token-b");
    vi.mocked(firestore.getDoc).mockResolvedValueOnce(
      snapshot({ hour: 20, timeZone: "UTC", tokens: [] }),
    );
    await turnOffRemindersOnThisDevice();
    expect(firestore.deleteDoc).toHaveBeenCalledWith("reminder-doc");
  });

  it("should turn off cleanly when the settings are already gone", async () => {
    localStorage.setItem("reminderToken", "token-a");
    vi.mocked(firestore.updateDoc).mockRejectedValue(notFound());
    vi.mocked(firestore.getDoc).mockResolvedValue(snapshot());
    const { turnOffRemindersOnThisDevice } = await load();

    await turnOffRemindersOnThisDevice();

    expect(firestore.deleteDoc).not.toHaveBeenCalled();
    expect(localStorage.getItem("reminderToken")).toBeNull();
  });

  it("should replace a token that FCM rotated, and leave an unchanged one alone", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    vi.stubEnv("VITE_FCM_VAPID_KEY", "test-key"); // read when the module loads
    onTestFinished(() => vi.unstubAllEnvs());
    localStorage.setItem("reminderToken", "token-new");
    const { syncReminderToken } = await load();

    await syncReminderToken();
    expect(firestore.updateDoc).not.toHaveBeenCalled();

    localStorage.setItem("reminderToken", "token-old");
    await syncReminderToken();
    expect(firestore.updateDoc).toHaveBeenNthCalledWith(1, "reminder-doc", {
      tokens: { remove: ["token-old"] },
    });
    expect(firestore.updateDoc).toHaveBeenNthCalledWith(2, "reminder-doc", {
      tokens: { union: ["token-new"] },
    });
    expect(localStorage.getItem("reminderToken")).toBe("token-new");
  });

  it("should not hold up logging out when the device can't be removed", async () => {
    localStorage.setItem("reminderToken", "token-a");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    onTestFinished(() => warn.mockRestore());
    vi.mocked(firestore.updateDoc).mockReturnValue(new Promise(() => {})); // offline: never settles
    vi.useFakeTimers();
    const { forgetThisDevice } = await load();

    const done = forgetThisDevice();
    await vi.advanceTimersByTimeAsync(3000);
    await expect(done).resolves.toBeUndefined();
    // Still forgotten locally, and the token itself is deleted.
    expect(localStorage.getItem("reminderToken")).toBeNull();
    expect(messaging.deleteToken).toHaveBeenCalled();
  });

  it("should read existing settings, and treat a missing document as off", async () => {
    vi.mocked(firestore.getDoc).mockResolvedValueOnce(snapshot());
    const { getReminderSettings, isOnForThisDevice } = await load();

    const settings = await getReminderSettings();
    expect(settings).toBeUndefined();
    expect(isOnForThisDevice(settings)).toBe(false);
  });
});
