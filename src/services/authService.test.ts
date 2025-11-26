import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import * as firebaseAuth from "firebase/auth";
import * as firebaseFirestore from "firebase/firestore";
import * as reactFirebaseHooks from "react-firebase-hooks/auth";
import { useAuth, login, logout } from "./authService";
import type { User, Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

vi.mock("firebase/auth");
vi.mock("firebase/firestore");
vi.mock("firebase/app");
vi.mock("react-firebase-hooks/auth");

// Mock the firebaseService to provide mocked auth instance
// This is necessary because authService imports `auth` from firebaseService
vi.mock("./firebaseService", () => ({
  auth: { type: "mock-auth" },
  db: { type: "mock-firestore" },
}));

describe("authService - Authentication workflows", () => {
  const signInWithPopupSpy = vi.spyOn(firebaseAuth, "signInWithPopup");
  const signOutSpy = vi.spyOn(firebaseAuth, "signOut");
  const getAuthSpy = vi.spyOn(firebaseAuth, "getAuth");
  const getFirestoreSpy = vi.spyOn(firebaseFirestore, "getFirestore");
  const useAuthStateSpy = vi.spyOn(reactFirebaseHooks, "useAuthState");

  const setupDefaultMocks = () => {
    getAuthSpy.mockReturnValue({ type: "mock-auth" } as unknown as Auth);
    getFirestoreSpy.mockReturnValue({
      type: "mock-firestore",
    } as unknown as Firestore);
    signInWithPopupSpy.mockResolvedValue(mockSignInResult);
    signOutSpy.mockResolvedValue();
    useAuthStateSpy.mockReturnValue([undefined, false, undefined] as ReturnType<
      typeof reactFirebaseHooks.useAuthState
    >);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  describe("useAuth hook - Authentication state management", () => {
    it("should return PENDING status while authentication is loading", () => {
      useAuthStateSpy.mockReturnValue([
        undefined,
        true,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);

      const { result } = renderHook(() => useAuth());

      expect(result.current).toEqual({
        status: "PENDING",
        user: undefined,
      });
    });

    it("should return REJECTED status when authentication fails", () => {
      const authError = new Error("Authentication failed");
      useAuthStateSpy.mockReturnValue([
        undefined,
        false,
        authError,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);

      const { result } = renderHook(() => useAuth());

      expect(result.current).toEqual({
        status: "REJECTED",
        user: undefined,
      });
    });

    it("should return RESOLVED status with user when authenticated", () => {
      useAuthStateSpy.mockReturnValue([
        mockUser,
        false,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);

      const { result } = renderHook(() => useAuth());

      expect(result.current).toEqual({
        status: "RESOLVED",
        user: mockUser,
      });
    });

    it("should return RESOLVED status with undefined user when not authenticated", () => {
      useAuthStateSpy.mockReturnValue([
        undefined,
        false,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);

      const { result } = renderHook(() => useAuth());

      expect(result.current).toEqual({
        status: "RESOLVED",
        user: undefined,
      });
    });

    it("should update status when authentication state changes", async () => {
      useAuthStateSpy.mockReturnValue([
        undefined,
        true,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);

      const { result, rerender } = renderHook(() => useAuth());

      expect(result.current.status).toBe("PENDING");

      useAuthStateSpy.mockReturnValue([
        mockUser,
        false,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);

      rerender();

      expect(result.current.status).toBe("RESOLVED");
      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe("login - GitHub authentication", () => {
    it("should successfully login with GitHub provider", async () => {
      const result = await login({ provider: "github" });

      expect(signInWithPopupSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
      );
      expect(result).toEqual(mockSignInResult);
    });

    it("should throw error for invalid provider", () => {
      expect(() => {
        login({ provider: "invalid" as "github" });
      }).toThrow("Invalid provider invalid");
    });

    it("should handle Firebase authentication errors", async () => {
      const authError = new Error("Firebase: Auth failed");
      signInWithPopupSpy.mockRejectedValue(authError);

      await expect(login({ provider: "github" })).rejects.toThrow(
        "Firebase: Auth failed",
      );
    });
  });

  describe("logout - Sign out functionality", () => {
    it("should successfully sign out user", async () => {
      await logout();

      expect(signOutSpy).toHaveBeenCalledWith(expect.anything());
    });

    it("should handle sign out errors", async () => {
      const signOutError = new Error("Sign out failed");
      signOutSpy.mockRejectedValue(signOutError);

      await expect(logout()).rejects.toThrow("Sign out failed");
    });
  });

  describe("Authentication flow - Complete user journey", () => {
    it("should transition from unauthenticated → loading → authenticated", async () => {
      useAuthStateSpy.mockReturnValue([
        undefined,
        false,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);

      const { result, rerender } = renderHook(() => useAuth());

      expect(result.current.status).toBe("RESOLVED");
      expect(result.current.user).toBeUndefined();

      useAuthStateSpy.mockReturnValue([
        undefined,
        true,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);
      rerender();

      expect(result.current.status).toBe("PENDING");

      useAuthStateSpy.mockReturnValue([
        mockUser,
        false,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);
      rerender();

      expect(result.current.status).toBe("RESOLVED");
      expect(result.current.user).toEqual(mockUser);
    });

    it("should handle authentication failure during login", async () => {
      useAuthStateSpy.mockReturnValue([
        undefined,
        true,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);

      const { result, rerender } = renderHook(() => useAuth());

      expect(result.current.status).toBe("PENDING");

      const authError = new Error("Network error");
      useAuthStateSpy.mockReturnValue([
        undefined,
        false,
        authError,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);
      rerender();

      expect(result.current.status).toBe("REJECTED");
      expect(result.current.user).toBeUndefined();
    });
  });
});

const mockUser = {
  uid: "test-user-123",
  email: "test@example.com",
  displayName: "Test User",
  photoURL: "https://example.com/photo.jpg",
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: "refresh-token",
  tenantId: null,
  delete: vi.fn(),
  getIdToken: vi.fn(),
  getIdTokenResult: vi.fn(),
  reload: vi.fn(),
  toJSON: vi.fn(),
  providerId: "github.com",
  phoneNumber: null,
} as User;

const mockSignInResult = {
  user: mockUser,
  providerId: "github.com",
  operationType: "signIn" as const,
};