import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach, onTestFinished } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Overview } from "./Overview";
import * as habitService from "../../services/habitService";
import type { Habit } from "../../domain/Habit";
import { createDate } from "../../utils/date";
import { setLanguageSetting } from "../../i18n/i18n";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual("react-router-dom")),
  useNavigate: () => mockNavigate,
}));
vi.mock("../../services/habitService", () => ({ getAllHabits: vi.fn() }));
vi.mock("../../services/firebaseService", () => ({ auth: {}, db: {} }));

const habit = (id: string, name: string, days: Record<string, "GOOD" | "BAD">, createdAt: Date): Habit => ({
  id,
  name,
  description: "",
  goal: { type: "daily" },
  streak: Object.entries(days).map(([date, status]) => ({ date: createDate(date), status, notes: "" })),
  createdAt,
});

describe("Overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Saturday 10 October 2026, local noon.
    vi.setSystemTime(new Date(2026, 9, 10, 12));
  });

  const renderOverview = () =>
    render(
      <MemoryRouter initialEntries={["/overview"]}>
        <Overview />
      </MemoryRouter>,
    );

  it("should sum up the period, describe each habit and open it", async () => {
    vi.mocked(habitService.getAllHabits).mockResolvedValue([
      habit("run", "Run", { "2026-10-08": "GOOD", "2026-10-09": "BAD", "2026-10-10": "GOOD" }, new Date(2026, 9, 8, 9)),
    ]);

    renderOverview();

    expect(await screen.findByText(/checked off/)).toHaveTextContent("Daily habits: 2 of 3 checked off (67 %)");
    expect(screen.getByText("Sep 28 – Oct 11")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    // Nothing before this period, and nothing after this week.
    expect(screen.getByRole("button", { name: "Earlier" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Later" })).toHaveAttribute("aria-disabled", "true");

    await userEvent.click(screen.getByRole("button", { name: "Run: 2 done, 1 missed, 1 in a row" }));
    expect(mockNavigate).toHaveBeenCalledWith("/habits/run", { state: { from: "/overview" } });
  });

  it("should switch to four weeks and step back through earlier periods", async () => {
    vi.mocked(habitService.getAllHabits).mockResolvedValue([
      habit("read", "Read", { "2026-08-20": "GOOD", "2026-10-10": "GOOD" }, new Date(2026, 7, 20, 9)),
    ]);

    renderOverview();
    await userEvent.click(await screen.findByRole("button", { name: "4 weeks" }));
    expect(screen.getByText("Sep 14 – Oct 11")).toBeInTheDocument();

    const earlier = screen.getByRole("button", { name: "Earlier" });
    await userEvent.click(earlier);
    expect(screen.getByText("Aug 17 – Sep 13")).toBeInTheDocument();
    // At the first period it is off, but keeps focus, and pressing it again does nothing.
    expect(earlier).toHaveAttribute("aria-disabled", "true");
    expect(earlier).toHaveFocus();
    await userEvent.click(earlier);
    expect(screen.getByText("Aug 17 – Sep 13")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Later" }));
    expect(screen.getByText("Sep 14 – Oct 11")).toBeInTheDocument();
  });

  it("should show how many times a weekly goal was reached each week", async () => {
    vi.mocked(habitService.getAllHabits).mockResolvedValue([
      {
        ...habit("gym", "Gym", { "2026-09-29": "GOOD", "2026-10-01": "GOOD", "2026-10-07": "GOOD" }, new Date(2026, 8, 28, 9)),
        goal: { type: "weekly", times: 2 },
      },
    ]);

    renderOverview();

    expect(await screen.findByRole("button", { name: "Gym: 3 done, weekly goal met 1 of 1 weeks, 1 wk in a row" })).toBeInTheDocument();
    expect(screen.getByText("2/2 ✓")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
    // This week is still under way, so its 1/2 isn't a missed week yet. Weekly goals are
    // shown per week, not in the daily summary.
    expect(screen.queryByText(/checked off/)).not.toBeInTheDocument();
  });

  it("should tell the user when habits can't be loaded", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => consoleErrorSpy.mockRestore());
    vi.mocked(habitService.getAllHabits).mockRejectedValue(new Error("offline"));

    renderOverview();

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load your habits.");
  });

  it("should point to Today when there are no habits", async () => {
    vi.mocked(habitService.getAllHabits).mockResolvedValue([]);

    renderOverview();

    expect(await screen.findByRole("link", { name: "Create one under Today" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("button", { name: "Earlier" })).not.toBeInTheDocument();
  });

  it("should speak Swedish", async () => {
    setLanguageSetting("sv");
    onTestFinished(() => setLanguageSetting("auto"));
    vi.mocked(habitService.getAllHabits).mockResolvedValue([
      habit("run", "Run", { "2026-10-08": "GOOD", "2026-10-09": "BAD", "2026-10-10": "GOOD" }, new Date(2026, 9, 8, 9)),
    ]);

    renderOverview();

    expect(await screen.findByText(/avbockade/)).toHaveTextContent("Dagliga vanor: 2 av 3 avbockade (67 %)");
    expect(screen.getByRole("heading", { name: "Översikt" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run: 2 klara, 1 missad, 1 i rad" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tidigare" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Senare" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "4 veckor" })).toBeInTheDocument();
  });
});
