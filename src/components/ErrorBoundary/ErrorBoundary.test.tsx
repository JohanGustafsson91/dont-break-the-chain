import "@testing-library/jest-dom";
import { describe, it, expect, vi, onTestFinished } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "./ErrorBoundary";

const Broken = () => {
  throw new Error("boom");
};

describe("ErrorBoundary - a crash shows a way out instead of a blank page", () => {
  it("should show a friendly message with a reload button", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => consoleErrorSpy.mockRestore());
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    onTestFinished(() => vi.unstubAllGlobals());

    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    await userEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(reload).toHaveBeenCalled();
  });
});
