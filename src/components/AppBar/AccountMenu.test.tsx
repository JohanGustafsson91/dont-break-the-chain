import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach, onTestFinished } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { User } from "firebase/auth";
import * as accountService from "../../services/accountService";
import * as authService from "../../services/authService";
import { AccountMenu } from "./AccountMenu";
import { ToastProvider } from "../Toast/Toast.Provider";

// Deliberate exception to "mock only at the edges": deletion order and failures are
// tested against mocked Firebase in accountService.test; here only the wiring matters.
vi.mock("../../services/accountService", async (importOriginal) => ({
  ...(await importOriginal<typeof accountService>()),
  downloadMyData: vi.fn(),
  deleteAccountAndData: vi.fn(),
}));

vi.mock("../../services/authService", async (importOriginal) => ({
  ...(await importOriginal<typeof authService>()),
  logout: vi.fn(),
}));

vi.mock("../../services/firebaseService", () => ({ auth: {}, db: {} }));

vi.mock("../../services/reminderService", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  remindersAvailable: true,
  getReminderSupport: vi.fn().mockResolvedValue("needs-install"),
  getReminderSettings: vi.fn().mockResolvedValue(undefined),
}));

const user = {
  uid: "user-1",
  email: "ada@example.com",
  displayName: "Ada",
  photoURL: null,
} as unknown as User;

const renderMenu = () =>
  render(
    <ToastProvider>
      <MemoryRouter>
        <AccountMenu user={user} />
      </MemoryRouter>
    </ToastProvider>,
  );

describe("AccountMenu - export, delete, legal links and log out", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should open from the avatar and offer every account action", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => vi.mocked(console.error).mockRestore());
    renderMenu();
    const trigger = screen.getByRole("button", { name: "Account menu" });

    expect(trigger).toHaveTextContent(/^A$/); // initial when there is no picture
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy policy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Terms of use" })).toHaveAttribute("href", "/terms");

    // A failed export is explained, and a successful retry replaces the message.
    vi.mocked(accountService.downloadMyData).mockRejectedValueOnce(new Error("offline"));
    await userEvent.click(screen.getByRole("button", { name: "Export my data" }));
    expect(screen.queryByRole("button", { name: "Export my data" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(await screen.findByRole("status")).toHaveTextContent("Couldn't export your data");

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("button", { name: "Export my data" }));
    expect(accountService.downloadMyData).toHaveBeenCalledTimes(2);
    expect(await screen.findByRole("status")).toHaveTextContent("Your data has been downloaded.");

    await userEvent.click(trigger);
    await userEvent.click(document.body);
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(authService.logout).toHaveBeenCalled();
  });

  it("should open the daily reminder settings from the menu", async () => {
    renderMenu();
    const trigger = screen.getByRole("button", { name: "Account menu" });

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("button", { name: "Daily reminder" }));

    const dialog = screen.getByRole("dialog", { name: "Daily reminder" });
    expect(await within(dialog).findByText(/Add to Home Screen/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("should only delete after confirming, and explain a failed deletion", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => consoleErrorSpy.mockRestore());
    vi.mocked(accountService.deleteAccountAndData).mockResolvedValue({
      ok: false,
      step: "account",
      error: new Error("failed"),
    });
    renderMenu();

    await userEvent.click(screen.getByRole("button", { name: "Account menu" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete my account" }));
    const dialog = screen.getByRole("alertdialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(accountService.deleteAccountAndData).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Account menu" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete my account" }));
    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete everything" }),
    );

    expect(accountService.deleteAccountAndData).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Your habits were deleted, but your account couldn't be removed. Please try again.",
    );
  });
});
