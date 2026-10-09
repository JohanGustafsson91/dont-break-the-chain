import "@testing-library/jest-dom";
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ToastProvider } from "./Toast.Provider";
import { useToast } from "./Toast.Context";

const Trigger = () => {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast("Couldn't save that day.")}>
      fail
    </button>
  );
};

describe("Toast - one message at a time, dismissed after a while", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should restart the timer when the same message is shown again", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    const fail = () => act(() => screen.getByRole("button", { name: "fail" }).click());

    fail();
    act(() => vi.advanceTimersByTime(7000));
    fail(); // the same failure again, 7 s later
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.getByRole("status")).toHaveTextContent("Couldn't save that day.");

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
