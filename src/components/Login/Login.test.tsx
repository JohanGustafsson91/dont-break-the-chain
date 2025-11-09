import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Login } from "./Login";
import * as authService from "../../services/authService";

vi.mock("../../services/authService", () => ({
  login: vi.fn(),
}));

vi.mock("../../utils/logger", () => ({
  LOG: {
    error: vi.fn(),
  },
}));

describe("Login - User authentication flow", () => {
  it("should allow user to login with GitHub", async () => {
    vi.mocked(authService.login).mockResolvedValue({
      user: { uid: "123", email: "user@example.com" },
    } as any);

    render(<Login />);

    // User sees the login page
    expect(screen.getByText("Don't Break The Chain")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Build habits, stay consistent, and keep your streak alive!",
      ),
    ).toBeInTheDocument();

    // User clicks the GitHub login button
    const loginButton = screen.getByRole("button", {
      name: "Login with GitHub",
    });
    await userEvent.click(loginButton);

    // Login is initiated with GitHub provider
    expect(authService.login).toHaveBeenCalledWith({ provider: "github" });
  });

  it("should show user an error if login fails", async () => {
    const mockLogger = await import("../../utils/logger");
    const error = new Error("Authentication failed");
    vi.mocked(authService.login).mockRejectedValue(error);

    render(<Login />);

    const loginButton = screen.getByRole("button", {
      name: "Login with GitHub",
    });
    await userEvent.click(loginButton);

    // Error is logged for debugging
    await vi.waitFor(() => {
      expect(mockLogger.LOG.error).toHaveBeenCalledWith("GitHub Login Failed:", {
        error,
      });
    });
  });
});
