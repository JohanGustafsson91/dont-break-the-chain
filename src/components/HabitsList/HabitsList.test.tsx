import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach, onTestFinished } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HabitsList } from "./HabitsList";
import { BrowserRouter } from "react-router-dom";
import * as habitService from "../../services/habitService";
import * as reminderService from "../../services/reminderService";
import { AppBarProvider } from "../AppBar/AppBar.Provider";
import { ToastProvider } from "../Toast/Toast.Provider";
import { AppBar } from "../AppBar/AppBar";
import type { User } from "firebase/auth";
import type { Habit } from "../../domain/Habit";
import { getToday } from "../../utils/date";

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

vi.mock("../../services/reminderService", () => ({
  recordTodayProgress: vi.fn(),
  refreshTodayProgress: vi.fn(),
  remindersAvailable: false,
  forgetThisDevice: vi.fn(),
  syncReminderToken: vi.fn(),
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
        <ToastProvider><AppBarProvider>
          <AppBar user={mockUser} />
          <HabitsList />
        </AppBarProvider></ToastProvider>
      </BrowserRouter>,
    );
  };

  it("should allow user to view their habits, see streaks, and navigate to details", async () => {
    // Setup: User has two habits with different streak patterns
    const mockHabits: Habit[] = [
      {
        id: "habit-1",
        name: "Morning Exercise",
        description: "30 min workout",
        goal: { type: "daily" },
        streak: [
          {
            date: new Date("2025-02-09T00:00:00.000Z"),
            status: "GOOD",
            notes: "Great session!",
          },
          {
            date: new Date("2025-02-08T00:00:00.000Z"),
            status: "GOOD",
            notes: "",
          },
          {
            date: new Date("2025-02-07T00:00:00.000Z"),
            status: "BAD",
            notes: "Skipped",
          },
        ],
      },
      {
        id: "habit-2",
        name: "Reading",
        description: "Read 20 pages",
        goal: { type: "daily" },
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

    // User can see progress (67% = 2 good / 3 total)
    expect(screen.getByText("Good 67 %")).toBeInTheDocument();
    expect(screen.getByText("No days yet")).toBeInTheDocument();

    // A new habit can be created from the end of the list.
    expect(screen.getByRole("button", { name: "+ New habit" })).toBeInTheDocument();

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
      expect(screen.getByText("Your habits")).toBeInTheDocument();
      expect(screen.getByText("No habits yet")).toBeInTheDocument();
    });

    const createButton = screen.getByRole("button", { name: "+ Create habit" });
    await userEvent.click(createButton);

    // User is navigated to the new habit
    await waitFor(() => {
      expect(habitService.addHabit).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/habits/new-habit-123", {
        state: { isNewHabit: true },
      });
      // The new habit is left to do today.
      expect(reminderService.refreshTodayProgress).toHaveBeenCalled();
    });
  });

  it("should allow user to mark today's status for a habit", async () => {
    const mockHabits: Habit[] = [
      {
        id: "habit-1",
        name: "Meditation",
        description: "10 min daily",
        goal: { type: "daily" },
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
    const goodRadio = screen.getByRole("radio", { name: "Done" });
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
    // The card's status line follows the mark.
    expect(await screen.findByText("Day 1 of a new chain")).toBeInTheDocument();

    // Reminders skip days with nothing left to do, so they get the habits as marked.
    expect(reminderService.recordTodayProgress).toHaveBeenLastCalledWith([
      expect.objectContaining({ streak: [expect.objectContaining({ status: "GOOD" })] }),
    ]);
  });

  it("should ask before unmarking today when it has a note", async () => {
    const mockHabits: Habit[] = [
      {
        id: "habit-1",
        name: "Meditation",
        description: "10 min daily",
        goal: { type: "daily" },
        streak: [
          { date: getToday(), status: "GOOD", notes: "Felt calm" },
        ],
      },
    ];

    vi.mocked(habitService.getAllHabits).mockResolvedValue(mockHabits);
    vi.mocked(habitService.updateHabit).mockResolvedValue();

    renderHabitsList();

    await waitFor(() => {
      expect(screen.getByText("Meditation")).toBeInTheDocument();
    });

    // Clicking the already checked ✓ unmarks today, which would delete the note
    await userEvent.click(screen.getByRole("radio", { name: "Done" }));

    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText(/Felt calm/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(habitService.updateHabit).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("radio", { name: "Done" }));
    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Remove" }),
    );

    await waitFor(() => {
      expect(habitService.updateHabit).toHaveBeenCalledWith("habit-1", {
        streak: [],
      });
    });
  });

  it("should show weekly progress and only a ✓ button for weekly goals", async () => {
    const mockHabits: Habit[] = [
      {
        id: "habit-1",
        name: "Gym",
        description: "",
        goal: { type: "weekly", times: 3 },
        streak: [{ date: getToday(), status: "GOOD", notes: "" }],
      },
    ];

    vi.mocked(habitService.getAllHabits).mockResolvedValue(mockHabits);

    renderHabitsList();

    await waitFor(() => {
      expect(screen.getByText("Gym")).toBeInTheDocument();
    });

    expect(screen.getByText("1/3 this week")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Done" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Missed" })).not.toBeInTheDocument();
  });

  it("should display habits with no streak data", async () => {
    const mockHabits: Habit[] = [
      {
        id: "habit-1",
        name: "New Habit",
        description: "Just started",
        goal: { type: "daily" },
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

  it("should tell the user when creating a habit fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => consoleErrorSpy.mockRestore());
    vi.mocked(habitService.getAllHabits).mockResolvedValue([]);
    vi.mocked(habitService.addHabit).mockRejectedValue(new Error("offline"));

    renderHabitsList();
    await userEvent.click(await screen.findByRole("button", { name: "+ Create habit" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Couldn't create the habit.");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should handle errors gracefully when fetching habits fails", async () => {
    vi.mocked(habitService.getAllHabits).mockRejectedValue(
      new Error("Network error"),
    );

    renderHabitsList();

    // User sees error message
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Couldn't load your habits.");
    });
    expect(screen.queryByRole("button", { name: /habit/ })).not.toBeInTheDocument();
  });
});
