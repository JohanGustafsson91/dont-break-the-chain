import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
    // The automatic check on opening finds it not verified yet.
    vi.mocked(authService.checkVerified).mockResolvedValue(false);
    render(<VerifyEmail user={{ email: "ada@example.com" } as User} />);
    expect(screen.getByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    expect(screen.getByText(/ada@example\.com/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "I've verified it" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Not verified yet.");

    vi.mocked(authService.resendVerification).mockResolvedValueOnce();
    await userEvent.click(screen.getByRole("button", { name: "Send the email again" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Sent. Check your inbox.");

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(authService.logout).toHaveBeenCalled();
  });

  it("should notice by itself when the link has been opened", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    vi.mocked(authService.checkVerified).mockResolvedValue(true);

    render(<VerifyEmail user={{ email: "ada@example.com" } as User} />);

    await waitFor(() => expect(assign).toHaveBeenCalledWith("/"));
    vi.unstubAllGlobals();
  });
});
