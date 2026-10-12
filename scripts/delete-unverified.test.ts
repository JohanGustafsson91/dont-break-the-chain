import { describe, it, expect, vi, onTestFinished } from "vitest";
import { deleteUnverified, isAbandoned, MAX_PER_RUN } from "./delete-unverified.mjs";

const NOW = new Date("2026-10-12T03:41:00Z");
const daysAgo = (days: number) => String(NOW.getTime() - days * 24 * 60 * 60 * 1000);
const user = (overrides: Record<string, unknown> = {}) => ({
  localId: "u1",
  emailVerified: false,
  createdAt: daysAgo(8),
  providerUserInfo: [{ providerId: "password" }],
  ...overrides,
});

const fakeApi = (users: ReturnType<typeof user>[], failed = 0) => ({
  users: async function* () {
    yield* users;
  },
  deleteUsers: vi.fn().mockResolvedValue(failed),
});

describe("delete-unverified - which accounts", () => {
  it("should pick an email account that was never verified, after seven days", () => {
    expect(isAbandoned(user(), NOW)).toBe(true);
    expect(isAbandoned(user({ createdAt: daysAgo(7) }), NOW)).toBe(false); // the full 7 days
    expect(isAbandoned(user({ emailVerified: undefined }), NOW)).toBe(true);
  });

  it("should never pick a verified, Google, GitHub or linked account", () => {
    expect(isAbandoned(user({ emailVerified: true }), NOW)).toBe(false);
    expect(isAbandoned(user({ providerUserInfo: [{ providerId: "google.com" }] }), NOW)).toBe(false);
    expect(isAbandoned(user({ providerUserInfo: [{ providerId: "github.com" }] }), NOW)).toBe(false);
    expect(
      isAbandoned(user({ providerUserInfo: [{ providerId: "password" }, { providerId: "google.com" }] }), NOW),
    ).toBe(false);
  });

  it("should leave an account alone when its details are missing", () => {
    expect(isAbandoned(user({ providerUserInfo: undefined }), NOW)).toBe(false);
    expect(isAbandoned(user({ providerUserInfo: [] }), NOW)).toBe(false); // anonymous
    expect(isAbandoned(user({ providerUserInfo: [{ providerId: "phone" }] }), NOW)).toBe(false);
    expect(isAbandoned(user({ createdAt: undefined }), NOW)).toBe(false);
  });
});

describe("delete-unverified - a run", () => {
  it("should delete only the abandoned accounts", async () => {
    const api = fakeApi([user({ localId: "old" }), user({ localId: "new", createdAt: daysAgo(1) })]);

    const counts = await deleteUnverified({ api, now: NOW, dryRun: false });

    expect(api.deleteUsers).toHaveBeenCalledWith(["old"]);
    expect(counts).toEqual({ checked: 2, abandoned: 1, deleted: 1, failed: 0 });
  });

  it("should delete nothing in a dry run or when there's nothing to delete", async () => {
    const dry = fakeApi([user()]);
    expect(await deleteUnverified({ api: dry, now: NOW, dryRun: true })).toEqual({
      checked: 1,
      abandoned: 1,
      deleted: 0,
      failed: 0,
    });
    expect(dry.deleteUsers).not.toHaveBeenCalled();

    const none = fakeApi([user({ emailVerified: true })]);
    await deleteUnverified({ api: none, now: NOW, dryRun: false });
    expect(none.deleteUsers).not.toHaveBeenCalled();
  });

  it("should refuse to delete an unusual number of accounts at once", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => spy.mockRestore());
    const many = Array.from({ length: MAX_PER_RUN + 1 }, (_, i) => user({ localId: `u${i}` }));
    const api = fakeApi(many);

    const counts = await deleteUnverified({ api, now: NOW, dryRun: false });

    expect(api.deleteUsers).not.toHaveBeenCalled();
    expect(counts.failed).toBe(MAX_PER_RUN + 1);
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/Refusing/));
  });

  it("should report accounts that couldn't be deleted", async () => {
    const api = fakeApi([user({ localId: "a" }), user({ localId: "b" })], 1);
    expect(await deleteUnverified({ api, now: NOW, dryRun: false })).toMatchObject({ deleted: 1, failed: 1 });
  });
});
