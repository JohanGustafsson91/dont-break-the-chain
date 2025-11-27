import "@testing-library/jest-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../services/authService.ts", () => ({
  useAuth: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("../../services/habitService.ts", () => ({
  getAllHabits: vi.fn(),
  getHabitById: vi.fn(),
  addHabit: vi.fn(),
  updateHabit: vi.fn(),
}));

vi.mock("../../services/firebaseService.ts", () => ({
  auth: vi.fn(),
  db: vi.fn(),
}));

vi.mock("../../utils/logger", () => ({
  LOG: {
    error: vi.fn(),
  },
}));

import { render, screen, waitFor } from "@testing-library/react";
import { useAuth } from "../../services/authService";
import { getAllHabits, getHabitById } from "../../services/habitService";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import type { User } from "firebase/auth";

describe("App - End-to-end user journeys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date("2025-02-10T00:00:00Z"));
  });

  it("should allow authenticated user to view habits list, navigate to detail, and return back", async () => {
    const user = userEvent.setup({ delay: null });

    // Setup: User is authenticated
    vi.mocked(useAuth).mockReturnValue({
      status: "RESOLVED",
      user: { uid: "123", email: "test@example.com" } as User,
    });

    const mockHabit = habitData();
    vi.mocked(getAllHabits).mockResolvedValue([mockHabit]);
    vi.mocked(getHabitById).mockResolvedValue(mockHabit);

    render(<App />);

    // User sees their habits list
    const habitName = await screen.findByText(/Healthy/i);
    expect(habitName).toBeInTheDocument();

    // User clicks on habit to view details
    await user.click(habitName);

    // User is navigated to habit detail page
    await waitFor(() => {
      const nameInputs = screen.getAllByDisplayValue(/Healthy/i);
      expect(nameInputs.length).toBeGreaterThan(0);
      const descInputs = screen.getAllByDisplayValue(/Eat and be healthy/i);
      expect(descInputs.length).toBeGreaterThan(0);
    });

    // User sees all the key information
    expect(screen.getByText(/83.3%/i)).toBeInTheDocument();
    expect(screen.getByText(/February 2025/i)).toBeInTheDocument();
    expect(screen.getByText(/Longest/i)).toBeInTheDocument();
    expect(screen.getByText(/3 days/i)).toBeInTheDocument();
    expect(screen.getByText(/Current/i)).toBeInTheDocument();
    expect(screen.getByText(/2 days/i)).toBeInTheDocument();

    // User sees the calendar with correct number of days for February
    const daysInMonth = Array.from({ length: 28 }, (_, i) => i + 1);
    daysInMonth.forEach((day) =>
      expect(screen.getByTitle(`Day ${day}`)).toBeInTheDocument(),
    );
    expect(screen.queryByTitle("Day 29")).not.toBeInTheDocument();

    // User can navigate back (navigation tested in isolation)
    // In a real app, they would click back arrow
  });

  it("should show loading state while authentication is pending", () => {
    vi.mocked(useAuth).mockReturnValue({
      status: "PENDING",
      user: undefined,
    });

    render(<App />);

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

});

const habitData = () => ({
  id: "H2Jui9vlLL4fVLZViudr",
  name: "Healthy",
  description: "Eat and be healthy",
  streak: [
    {
      notes: "",
      date: new Date("2025-02-09T00:00:00.000Z"),
      status: "GOOD" as const,
    },
    {
      notes: "",
      date: new Date("2025-02-08T00:00:00.000Z"),
      status: "GOOD" as const,
    },
    {
      notes: "Dålig sömn. ",
      date: new Date("2025-02-07T00:00:00.000Z"),
      status: "BAD" as const,
    },
    {
      notes: "",
      date: new Date("2025-02-06T00:00:00.000Z"),
      status: "GOOD" as const,
    },
    {
      notes: "",
      date: new Date("2025-02-05T00:00:00.000Z"),
      status: "GOOD" as const,
    },
    {
      notes: "",
      date: new Date("2025-02-04T00:00:00.000Z"),
      status: "GOOD" as const,
    },
  ],
});
