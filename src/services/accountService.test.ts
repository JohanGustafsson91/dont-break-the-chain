import { describe, it, expect, vi, beforeEach } from "vitest";
import * as firebaseAuth from "firebase/auth";
import * as firestore from "firebase/firestore";
import type { QuerySnapshot, WriteBatch } from "firebase/firestore";
import {
  buildExport,
  deleteAccountAndData,
  deletionFailureMessage,
} from "./accountService";

vi.mock("firebase/auth");
vi.mock("firebase/firestore");

const mockUser = vi.hoisted(() => ({
  uid: "user-1",
  displayName: "Ada",
  email: "ada@example.com",
  photoURL: "https://example.com/ada.png",
  providerData: [{ providerId: "github.com" }],
  metadata: { creationTime: "Mon, 03 Feb 2025 09:00:00 GMT", lastSignInTime: "Sat, 15 Feb 2025 08:00:00 GMT" },
}));

vi.mock("./firebaseService", () => ({
  auth: { currentUser: mockUser },
  db: {},
}));

const failure = (code: string) => Object.assign(new Error(code), { code });

describe("accountService - export and account deletion", () => {
  const batch = { delete: vi.fn(), commit: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(firestore.writeBatch).mockReturnValue(batch as unknown as WriteBatch);
    vi.mocked(firestore.getDocs).mockResolvedValue({
      docs: [{ ref: "habit-a" }, { ref: "habit-b" }],
    } as unknown as QuerySnapshot);
    batch.commit.mockResolvedValue(undefined);
    vi.mocked(firebaseAuth.reauthenticateWithPopup).mockResolvedValue(
      {} as firebaseAuth.UserCredential,
    );
    vi.mocked(firebaseAuth.deleteUser).mockResolvedValue();
  });

  it("should export the account and every habit with plain dates", () => {
    const data = buildExport(
      mockUser as unknown as firebaseAuth.User,
      [
        {
          id: "h1",
          name: "Run",
          description: "",
          goal: { type: "daily" },
          streak: [{ date: new Date("2025-02-14T00:00:00Z"), status: "GOOD", notes: "5 km" }],
          createdAt: new Date("2025-02-03T09:05:00Z"),
        },
      ],
      new Date("2025-02-15T10:00:00Z"),
    );

    expect(data).toEqual({
      exportedAt: "2025-02-15T10:00:00.000Z",
      account: {
        id: "user-1",
        name: "Ada",
        email: "ada@example.com",
        pictureUrl: "https://example.com/ada.png",
        signInProviders: ["github.com"],
        createdAt: "Mon, 03 Feb 2025 09:00:00 GMT",
        lastSignInAt: "Sat, 15 Feb 2025 08:00:00 GMT",
      },
      habits: [
        {
          id: "h1",
          name: "Run",
          description: "",
          goal: { type: "daily" },
          createdAt: "2025-02-03T09:05:00.000Z",
          days: [{ date: "2025-02-14", status: "GOOD", notes: "5 km" }],
        },
      ],
    });
  });

  it("should confirm the user first, then delete the habits, then the account", async () => {
    expect(await deleteAccountAndData()).toEqual({ ok: true });

    const reauth = vi.mocked(firebaseAuth.reauthenticateWithPopup).mock.invocationCallOrder[0];
    const commit = batch.commit.mock.invocationCallOrder[0];
    const removeUser = vi.mocked(firebaseAuth.deleteUser).mock.invocationCallOrder[0];
    expect(reauth).toBeLessThan(commit);
    expect(commit).toBeLessThan(removeUser);
    expect(batch.delete.mock.calls.map(([ref]) => ref)).toEqual(["habit-a", "habit-b"]);
    // Re-authentication uses the provider the user signed in with.
    expect(vi.mocked(firebaseAuth.reauthenticateWithPopup).mock.calls[0][1]).toBeInstanceOf(
      firebaseAuth.GithubAuthProvider,
    );
  });

  it("should delete nothing when the user doesn't confirm it's them", async () => {
    vi.mocked(firebaseAuth.reauthenticateWithPopup).mockRejectedValue(
      failure("auth/popup-closed-by-user"),
    );

    const result = await deleteAccountAndData();

    expect(result).toMatchObject({ ok: false, step: "reauthenticate" });
    expect(batch.commit).not.toHaveBeenCalled();
    expect(firebaseAuth.deleteUser).not.toHaveBeenCalled();
    expect(deletionFailureMessage(result as Extract<typeof result, { ok: false }>)).toBe(
      "Nothing was deleted.",
    );
  });

  it("should keep the account when deleting habits fails, and say what happened at each step", async () => {
    batch.commit.mockRejectedValue(failure("unavailable"));
    const habitsFailed = await deleteAccountAndData();

    expect(habitsFailed).toMatchObject({ ok: false, step: "habits" });
    expect(firebaseAuth.deleteUser).not.toHaveBeenCalled();

    batch.commit.mockResolvedValue(undefined);
    vi.mocked(firebaseAuth.deleteUser).mockRejectedValue(failure("auth/requires-recent-login"));
    const accountFailed = await deleteAccountAndData();

    expect(accountFailed).toMatchObject({ ok: false, step: "account" });
    expect(deletionFailureMessage(accountFailed as Extract<typeof accountFailed, { ok: false }>)).toBe(
      "Your habits were deleted, but your account couldn't be removed. Please try again.",
    );
    expect(
      deletionFailureMessage({ ok: false, step: "reauthenticate", error: failure("auth/user-mismatch") }),
    ).toBe("Choose the same account you're signed in with. Nothing was deleted.");
  });
});
