import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HabitsList } from "./HabitsList";
import { BrowserRouter } from "react-router-dom";
import * as habitService from "../../services/habitService";
import { AppBarProvider } from "../AppBar/AppBar.Provider";
import { AppBar } from "../AppBar/AppBar";
import type { User } from "firebase/auth";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../services/habitService", () => ({
  getAllHabits: vi.fn(),
  addHabit: vi.fn(),
  updateHabit: vi.fn(),
}));

vi.mock("../../utils/logger", () => ({
  LOG: {
    error: vi.fn(),
  },
}));

vi.mock("../../services/firebaseService", () => ({
  auth: {},
  db: {},
}));

describe("HabitsList - User workflows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderHabitsList = () => {
    const mockUser = {
      uid: "test-user",
      email: "test@example.com",
      photoURL: "https://example.com/photo.jpg",
    } as User;

    return render(
      <BrowserRouter>
        <AppBarProvider>
          <AppBar user={mockUser} />
          <HabitsList />
        </AppBarProvider>
      </BrowserRouter>,
    );
  };

  it("should allow user to view their habits, see streaks, and navigate to details", async () => {
    // Setup: User has two habits with different streak patterns
    const mockHabits = [
      {
        id: "habit-1",
        name: "Morning Exercise",
        description: "30 min workout",
        streak: [
          {
            date: new Date("2025-02-09T00:00:00.000Z"),
            status: "GOOD" as const,
            notes: "Great session!",
          },
          {
            date: new Date("2025-02-08T00:00:00.000Z"),
            status: "GOOD" as const,
            notes: "",
          },
          {
            date: new Date("2025-02-07T00:00:00.000Z"),
            status: "BAD" as const,
            notes: "Skipped",
          },
        ],
      },
      {
        id: "habit-2",
        name: "Reading",
        description: "Read 20 pages",
        streak: [],
      },
    ];

    vi.mocked(habitService.getAllHabits).mockResolvedValue(mockHabits);

    renderHabitsList();

    // User sees both habits
    await waitFor(() => {
      expect(screen.getByText("Morning Exercise")).toBeInTheDocument();
      expect(screen.getByText("Reading")).toBeInTheDocument();
    });

    // User can see streak stats displayed (there are 2 habits so getAllByText)
    expect(screen.getAllByText("🔄")).toHaveLength(2); // Current streak icons
    expect(screen.getAllByText("🔥")).toHaveLength(2); // Longest streak icons

    // User can see progress (66.7% = 2 good / 3 total)
    expect(screen.getByText("66.7%")).toBeInTheDocument();

    // User clicks on a habit to see details
    const exerciseHabit = screen.getByText("Morning Exercise");
    await userEvent.click(exerciseHabit);

    expect(mockNavigate).toHaveBeenCalledWith("/habits/habit-1");
  });

  it("should allow user to create a new habit and navigate to it", async () => {
    vi.mocked(habitService.getAllHabits).mockResolvedValue([]);
    vi.mocked(habitService.addHabit).mockResolvedValue("new-habit-123");

    renderHabitsList();

    // User clicks create habit button
    await waitFor(() => {
      expect(screen.getByText("Habits")).toBeInTheDocument();
    });

    const createButton = screen.getByRole("button", { name: "Create habit" });
    await userEvent.click(createButton);

    // User is navigated to the new habit
    await waitFor(() => {
      expect(habitService.addHabit).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/habits/new-habit-123");
    });
  });

  it("should allow user to mark today's status for a habit", async () => {
    const mockHabits = [
      {
        id: "habit-1",
        name: "Meditation",
        description: "10 min daily",
        streak: [],
      },
    ];

    vi.mocked(habitService.getAllHabits).mockResolvedValue(mockHabits);
    vi.mocked(habitService.updateHabit).mockResolvedValue();

    renderHabitsList();

    await waitFor(() => {
      expect(screen.getByText("Meditation")).toBeInTheDocument();
    });

    // User marks today as GOOD by clicking the good radio button
    const goodRadio = screen.getByRole("radio", { name: "✅" });
    await userEvent.click(goodRadio);

    // The habit service should be called to update the streak
    await waitFor(() => {
      expect(habitService.updateHabit).toHaveBeenCalledWith(
        "habit-1",
        expect.objectContaining({
          streak: expect.arrayContaining([
            expect.objectContaining({
              status: "GOOD",
            }),
          ]),
        }),
      );
    });
  });

  it("should display habits with no streak data", async () => {
    const mockHabits = [
      {
        id: "habit-1",
        name: "New Habit",
        description: "Just started",
        streak: [],
      },
    ];

    vi.mocked(habitService.getAllHabits).mockResolvedValue(mockHabits);

    renderHabitsList();

    // User sees their new habit in the list
    await waitFor(() => {
      expect(screen.getByText("New Habit")).toBeInTheDocument();
    });

    // User can see it has no streak yet (0 days current/longest)
    expect(screen.getAllByText("🔄")).toHaveLength(1);
    expect(screen.getAllByText("🔥")).toHaveLength(1);
  });

  it("should handle errors gracefully when fetching habits fails", async () => {
    vi.mocked(habitService.getAllHabits).mockRejectedValue(
      new Error("Network error"),
    );

    renderHabitsList();

    // User sees error message
    await waitFor(() => {
      expect(screen.getByText("Could not fetch habits...")).toBeInTheDocument();
    });
  });
});
