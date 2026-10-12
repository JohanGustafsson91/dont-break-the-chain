import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "firebase/auth";
import * as authService from "../../services/authService";
import { VerifyEmail } from "./VerifyEmail";

vi.mock("../../services/authService", () => ({
  checkVerified: vi.fn(),
  resendVerification: vi.fn(),
  logout: vi.fn(),
}));

describe("VerifyEmail - an email account verifies its address before using the app", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should say where the link went, resend it, and only move on once verified", async () => {
    render(<VerifyEmail user={{ email: "ada@example.com" } as User} />);
    expect(screen.getByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    expect(screen.getByText(/ada@example\.com/)).toBeInTheDocument();

    vi.mocked(authService.checkVerified).mockResolvedValueOnce(false);
    await userEvent.click(screen.getByRole("button", { name: "I've verified it" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Not verified yet.");

    vi.mocked(authService.resendVerification).mockResolvedValueOnce();
    await userEvent.click(screen.getByRole("button", { name: "Send the email again" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Sent. Check your inbox.");

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(authService.logout).toHaveBeenCalled();
  });
});
