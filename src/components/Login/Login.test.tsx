import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach, onTestFinished } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Login } from "./Login";
import * as firebaseAuth from "firebase/auth";
import * as firebaseFirestore from "firebase/firestore";
import type { User, Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import React from "react";
import { setLanguageSetting } from "../../i18n/i18n";

vi.mock("firebase/auth");
vi.mock("firebase/firestore");
vi.mock("firebase/app");
vi.mock("react-firebase-hooks/auth");
vi.mock("../../services/firebaseService", () => ({ app: {}, auth: {}, db: {} }));

describe("Login - User authentication flow", () => {
  const signInWithPopupSpy = vi.spyOn(firebaseAuth, "signInWithPopup");
  const getAuthSpy = vi.spyOn(firebaseAuth, "getAuth");
  const getFirestoreSpy = vi.spyOn(firebaseFirestore, "getFirestore");

  const setupDefaultMocks = () => {
    getAuthSpy.mockReturnValue({ type: "mock-auth" } as unknown as Auth);
    getFirestoreSpy.mockReturnValue({
      type: "mock-firestore",
    } as unknown as Firestore);
    signInWithPopupSpy.mockResolvedValue(mockSignInResult);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setupDefaultMocks();
  });

  const renderLogin = () =>
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

  it("should let a visitor sign in right away, with the terms linked next to the buttons", async () => {
    renderLogin();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("One check a day. Don't break the chain.");
    // Signing in is accepting the terms: no box to tick first.
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "terms of use" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "privacy policy" })).toHaveAttribute("href", "/privacy");

    await userEvent.click(screen.getByRole("button", { name: "Continue with GitHub" }));
    expect(signInWithPopupSpy).toHaveBeenCalled();
  });

  it("should offer Google too, and say so when the email already uses GitHub", async () => {
    signInWithPopupSpy.mockRejectedValue(
      Object.assign(new Error("exists"), { code: "auth/account-exists-with-different-credential" }),
    );
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => consoleErrorSpy.mockRestore());
    renderLogin();

    const googleButton = screen.getByRole("button", { name: "Continue with Google" });
    await userEvent.click(googleButton);

    const [, provider] = signInWithPopupSpy.mock.calls[0];
    expect(provider).toBeInstanceOf(firebaseAuth.GoogleAuthProvider);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "An account with this email already exists. Sign in with GitHub or your email and password instead.",
    );

    // Closing the window is not an error worth showing, and clears the old message.
    signInWithPopupSpy.mockRejectedValue(
      Object.assign(new Error("closed"), { code: "auth/popup-closed-by-user" }),
    );
    await userEvent.click(googleButton);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should let a visitor try a habit and switch language before signing in", async () => {
    onTestFinished(() => setLanguageSetting("auto"));
    renderLogin();

    // The app's real status line: one tap from a milestone, and back again.
    expect(screen.getByText("Today is day 7 🎯")).toBeInTheDocument();
    const check = screen.getByRole("button", { name: "Mark today as done" });
    await userEvent.click(check);
    expect(check).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("7 days in a row 🎉")).toBeInTheDocument();
    await userEvent.click(check);
    expect(screen.getByText("Today is day 7 🎯")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Svenska" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("En bock om dagen. Bryt inte kedjan.");
    expect(screen.getByText("Idag är det dag 7 🎯")).toBeInTheDocument();
  });

  it("should sign in or create an account with email and password, and help with a forgotten password", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => consoleErrorSpy.mockRestore());
    renderLogin();
    await userEvent.click(screen.getByRole("button", { name: "Continue with email" }));

    // A wrong password says so, without telling whether the email has an account.
    vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockRejectedValueOnce(
      Object.assign(new Error("bad"), { code: "auth/invalid-credential" }),
    );
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong password");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(vi.mocked(firebaseAuth.signInWithEmailAndPassword).mock.calls[0].slice(1)).toEqual(["ada@example.com", "wrong password"]);
    expect(await screen.findByRole("alert")).toHaveTextContent("Wrong email or password.");

    vi.mocked(firebaseAuth.sendPasswordResetEmail).mockResolvedValueOnce();
    await userEvent.click(screen.getByRole("button", { name: "Forgot your password?" }));
    expect(await screen.findByRole("status")).toHaveTextContent("If there's an account for ada@example.com");

    await userEvent.click(screen.getByRole("button", { name: "New here? Create an account" }));
    expect(screen.getByText("At least 8 characters.")).toBeInTheDocument();
    vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValueOnce({ user: { uid: "new" } } as firebaseAuth.UserCredential);
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mock.calls[0].slice(1)).toEqual(["ada@example.com", "wrong password"]);
  });

  it("should confirm a deleted account once", () => {
    sessionStorage.setItem("accountDeleted", "1");
    const { unmount } = renderLogin();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Your account and all your data have been deleted.",
    );
    unmount();

    renderLogin();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("should speak Swedish, sign-in errors included", async () => {
    setLanguageSetting("sv");
    onTestFinished(() => setLanguageSetting("auto"));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => consoleErrorSpy.mockRestore());
    signInWithPopupSpy.mockRejectedValue(
      Object.assign(new Error("exists"), { code: "auth/account-exists-with-different-credential" }),
    );
    renderLogin();

    expect(screen.getByText("Don't Break The Chain")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "användarvillkoren" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "integritetspolicyn" })).toHaveAttribute("href", "/privacy");
    await userEvent.click(screen.getByRole("button", { name: "Fortsätt med Google" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Det finns redan ett konto med den här e-postadressen. Logga in med GitHub eller med e-post och lösenord i stället.",
    );
  });

  it("should tell the user when signing in with GitHub fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => consoleErrorSpy.mockRestore());
    signInWithPopupSpy.mockRejectedValue(new Error("Authentication failed"));

    renderLogin();
    await userEvent.click(screen.getByRole("button", { name: "Continue with GitHub" }));

    const [, provider] = signInWithPopupSpy.mock.calls[0];
    expect(provider).toBeInstanceOf(firebaseAuth.GithubAuthProvider);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Signing in didn't work. Please try again.",
    );
  });
});

const mockUser = {
  uid: "test-user-123",
  email: "test@example.com",
  displayName: "Test User",
  photoURL: "https://example.com/photo.jpg",
} as User;

const mockSignInResult = {
  user: mockUser,
  providerId: "github.com",
  operationType: "signIn" as const,
};
