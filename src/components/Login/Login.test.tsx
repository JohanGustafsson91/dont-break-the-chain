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

vi.mock("firebase/auth");
vi.mock("firebase/firestore");
vi.mock("firebase/app");
vi.mock("react-firebase-hooks/auth");

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
    setupDefaultMocks();
  });

  const renderLogin = () =>
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

  it("should require accepting the terms before logging in with GitHub", async () => {
    renderLogin();

    expect(screen.getByText("Don't Break The Chain")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Build habits, stay consistent, and keep your streak alive!",
      ),
    ).toBeInTheDocument();

    const loginButton = screen.getByRole("button", {
      name: "Continue with GitHub",
    });
    expect(loginButton).toBeDisabled();
    expect(screen.getByRole("link", { name: "terms of use" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "privacy policy" })).toHaveAttribute("href", "/privacy");

    await userEvent.click(screen.getByRole("checkbox", { name: /I accept the terms of use/ }));
    expect(loginButton).toBeEnabled();
    await userEvent.click(loginButton);

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
    expect(googleButton).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox", { name: /I accept the terms of use/ }));
    await userEvent.click(googleButton);

    const [, provider] = signInWithPopupSpy.mock.calls[0];
    expect(provider).toBeInstanceOf(firebaseAuth.GoogleAuthProvider);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "An account with this email already exists. Sign in with GitHub instead.",
    );

    // Closing the window is not an error worth showing, and clears the old message.
    signInWithPopupSpy.mockRejectedValue(
      Object.assign(new Error("closed"), { code: "auth/popup-closed-by-user" }),
    );
    await userEvent.click(googleButton);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should tell the user when signing in with GitHub fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => consoleErrorSpy.mockRestore());
    signInWithPopupSpy.mockRejectedValue(new Error("Authentication failed"));

    renderLogin();
    await userEvent.click(screen.getByRole("checkbox", { name: /I accept the terms of use/ }));
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
