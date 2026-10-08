import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { useSyncExternalStore } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "firebase/auth";

// A tiny auth store, so signing out re-renders every useAuth() consumer the way
// Firebase's auth listener does.
const authStore = vi.hoisted(() => {
  let state: { status: "RESOLVED"; user: unknown } = { status: "RESOLVED", user: undefined };
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (next: typeof state) => {
      state = next;
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
});

vi.mock("../../services/authService.ts", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useAuth: () => useSyncExternalStore(authStore.subscribe, authStore.get),
  logout: vi.fn(),
}));

vi.mock("../../services/accountService.ts", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  // The sign-out can reach the app after deleteUser has resolved, so the app briefly
  // still thinks the user is signed in while it shows the login page.
  deleteAccountAndData: vi.fn(async () => {
    setTimeout(() => authStore.set({ status: "RESOLVED", user: undefined }), 0);
    return { ok: true };
  }),
}));

vi.mock("../../services/habitService.ts", () => ({
  getAllHabits: vi.fn().mockResolvedValue([]),
  getHabitById: vi.fn(),
  addHabit: vi.fn(),
  updateHabit: vi.fn(),
}));

vi.mock("../../services/firebaseService.ts", () => ({ auth: {}, db: {} }));

import { App } from "./App";

describe("App - deleting the account", () => {
  it("should land on the login page and confirm the deletion", async () => {
    const user = userEvent.setup({ delay: null });
    authStore.set({
      status: "RESOLVED",
      user: { uid: "u1", email: "ada@example.com", photoURL: null } as unknown as User,
    });
    window.history.pushState({}, "", "/");
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Account menu" }));
    await user.click(screen.getByRole("button", { name: "Delete my account" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete everything" }),
    );

    expect(await screen.findByRole("button", { name: "Continue with GitHub" })).toBeInTheDocument();
    expect(screen.getByText("Your account and all your data have been deleted.")).toBeInTheDocument();
  });
});
