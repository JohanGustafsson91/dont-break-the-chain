import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AppBarProvider } from "../AppBar/AppBar.Provider";
import * as reactFirebaseHooks from "react-firebase-hooks/auth";
import type { User } from "firebase/auth";
import React from "react";

vi.mock("firebase/auth");
vi.mock("react-firebase-hooks/auth");

describe("ProtectedRoute - Routing and authentication", () => {
  const useAuthStateSpy = vi.spyOn(reactFirebaseHooks, "useAuthState");

  const setupDefaultMocks = () => {
    // Default: unauthenticated, not loading, no error
    useAuthStateSpy.mockReturnValue([undefined, false, undefined] as ReturnType<
      typeof reactFirebaseHooks.useAuthState
    >);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  describe("Authentication state - Loading", () => {
    it("should show loading state while authentication is pending", () => {
      useAuthStateSpy.mockReturnValue([
        undefined,
        true,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);

      render(
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText("Loading")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("Unauthenticated user - Protected route", () => {
    it("should redirect unauthenticated user to login page", () => {
      useAuthStateSpy.mockReturnValue([
        undefined,
        false,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);

      const { container } = render(
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
      expect(container.innerHTML).not.toContain("Protected Content");
    });

    it("should use custom redirect path when provided", () => {
      useAuthStateSpy.mockReturnValue([
        undefined,
        false,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);

      const { container } = render(
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute redirectPath="/custom-login">
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/custom-login" element={<div>Custom Login</div>} />
          </Routes>
        </MemoryRouter>,
      );

      expect(container.innerHTML).not.toContain("Protected Content");
    });
  });

  describe("Authenticated user - Protected route", () => {
    it("should render protected content for authenticated user", () => {
      useAuthStateSpy.mockReturnValue([
        mockUser,
        false,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);

      render(
        <AppBarProvider>
          <MemoryRouter initialEntries={["/protected"]}>
            <Routes>
              <Route
                path="/protected"
                element={
                  <ProtectedRoute>
                    <div>Protected Content</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </AppBarProvider>,
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should render AppBar for authenticated user", () => {
      useAuthStateSpy.mockReturnValue([
        mockUser,
        false,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);

      render(
        <AppBarProvider>
          <MemoryRouter initialEntries={["/protected"]}>
            <Routes>
              <Route
                path="/protected"
                element={
                  <ProtectedRoute>
                    <div>Protected Content</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </AppBarProvider>,
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
      // AppBar renders with logout button
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Authenticated user - Login page", () => {
    it("should redirect authenticated user away from login page to home", () => {
      useAuthStateSpy.mockReturnValue([
        mockUser,
        false,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);

      const { container } = render(
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route
              path="/login"
              element={
                <ProtectedRoute isLoginPage>
                  <div>Login Form</div>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<div>Home Page</div>} />
          </Routes>
        </MemoryRouter>,
      );

      expect(container.innerHTML).not.toContain("Login Form");
    });
  });

  describe("Unauthenticated user - Login page", () => {
    it("should render login page for unauthenticated user", () => {
      useAuthStateSpy.mockReturnValue([
        undefined,
        false,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);

      render(
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route
              path="/login"
              element={
                <ProtectedRoute isLoginPage>
                  <div>Login Form</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText("Login Form")).toBeInTheDocument();
    });

    it("should not render AppBar on login page for unauthenticated user", () => {
      useAuthStateSpy.mockReturnValue([
        undefined,
        false,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);

      render(
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route
              path="/login"
              element={
                <ProtectedRoute isLoginPage>
                  <div>Login Form</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText("Login Form")).toBeInTheDocument();
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
  });

  describe("Complete authentication flow", () => {
    it("should transition from loading → unauthenticated → redirect to login", () => {
      useAuthStateSpy.mockReturnValue([
        undefined,
        true,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);

      const { rerender, container } = render(
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText("Loading")).toBeInTheDocument();

      useAuthStateSpy.mockReturnValue([
        undefined,
        false,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);

      rerender(
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
      expect(container.innerHTML).not.toContain("Protected Content");
    });

    it("should transition from loading → authenticated → render content", () => {
      useAuthStateSpy.mockReturnValue([
        undefined,
        true,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);

      const { rerender } = render(
        <AppBarProvider>
          <MemoryRouter initialEntries={["/protected"]}>
            <Routes>
              <Route
                path="/protected"
                element={
                  <ProtectedRoute>
                    <div>Protected Content</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </AppBarProvider>,
      );

      expect(screen.getByText("Loading")).toBeInTheDocument();

      useAuthStateSpy.mockReturnValue([
        mockUser,
        false,
        undefined,
      ] as ReturnType<typeof reactFirebaseHooks.useAuthState>);

      rerender(
        <AppBarProvider>
          <MemoryRouter initialEntries={["/protected"]}>
            <Routes>
              <Route
                path="/protected"
                element={
                  <ProtectedRoute>
                    <div>Protected Content</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </AppBarProvider>,
      );

      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });
});

// Test data at bottom
const mockUser = {
  uid: "test-user-123",
  email: "test@example.com",
  displayName: "Test User",
  photoURL: "https://example.com/photo.jpg",
} as User;
