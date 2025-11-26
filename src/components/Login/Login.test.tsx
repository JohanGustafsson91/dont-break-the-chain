import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("should allow user to login with GitHub", async () => {
    render(<Login />);

    expect(screen.getByText("Don't Break The Chain")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Build habits, stay consistent, and keep your streak alive!",
      ),
    ).toBeInTheDocument();

    const loginButton = screen.getByRole("button", {
      name: "Login with GitHub",
    });
    await userEvent.click(loginButton);

    expect(signInWithPopupSpy).toHaveBeenCalled();
  });

  it("should handle authentication errors gracefully", async () => {
    const authError = new Error("Authentication failed");
    signInWithPopupSpy.mockRejectedValue(authError);

    render(<Login />);

    const loginButton = screen.getByRole("button", {
      name: "Login with GitHub",
    });

    await expect(userEvent.click(loginButton)).resolves.not.toThrow();
    expect(signInWithPopupSpy).toHaveBeenCalled();
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
