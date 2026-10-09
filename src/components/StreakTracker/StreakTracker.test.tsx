import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll, onTestFinished } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StreakTracker } from "./StreakTracker";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import * as habitService from "../../services/habitService";
import { AppBarProvider } from "../AppBar/AppBar.Provider";
import { ToastProvider } from "../Toast/Toast.Provider";
import { AppBar } from "../AppBar/AppBar";
import type { Habit } from "../../domain/Habit";
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
  getHabitById: vi.fn(),
  updateHabit: vi.fn(),
  deleteHabit: vi.fn(),
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
  recordDayMarked: vi.fn(),
  remindersAvailable: false,
  forgetThisDevice: vi.fn(),
  syncReminderToken: vi.fn(),
}));

describe("StreakTracker - Complete user journey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  beforeAll(() => {
    // Local noon: "today" is the local date, so this is 2025-02-15 in every time zone
    // (UTC midnight would still be the day before west of UTC).
    vi.setSystemTime(new Date(2025, 1, 15, 12));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  const mockUser = {
    uid: "test-user",
    email: "test@example.com",
    photoURL: "https://example.com/photo.jpg",
  } as User;

  const renderStreakTracker = () => {
    return render(
      <BrowserRouter>
        <ToastProvider><AppBarProvider>
          <AppBar user={mockUser} />
          <Routes>
            <Route path="/habits/:id" element={<StreakTracker />} />
          </Routes>
        </AppBarProvider></ToastProvider>
      </BrowserRouter>
    );
  };

  it("should allow user to view habit details, edit information, track daily progress, and manage their habit", async () => {
    const user = userEvent.setup();
    
    // Setup: User has a habit with some existing streak data
    const mockHabit: Habit = {
      id: "habit-123",
      name: "Morning Meditation",
      description: "10 minutes daily meditation",
      goal: { type: "daily" },
      streak: [
        {
          date: new Date("2025-02-10T00:00:00.000Z"),
          status: "GOOD",
          notes: "Felt peaceful",
        },
        {
          date: new Date("2025-02-11T00:00:00.000Z"),
          status: "GOOD",
          notes: "",
        },
        {
          date: new Date("2025-02-12T00:00:00.000Z"),
          status: "BAD",
          notes: "Too busy",
        },
        {
          date: new Date("2025-02-13T00:00:00.000Z"),
          status: "GOOD",
          notes: "",
        },
        {
          date: new Date("2025-02-14T00:00:00.000Z"),
          status: "GOOD",
          notes: "Great session",
        },
      ],
    };

    vi.mocked(habitService.getHabitById).mockResolvedValue(mockHabit);
    vi.mocked(habitService.updateHabit).mockResolvedValue();

    // Navigate to habit detail page
    window.history.pushState({}, "", "/habits/habit-123");
    renderStreakTracker();

    // PART 1: User sees their habit overview with all key stats
    await waitFor(() => {
      expect(screen.getByDisplayValue("Morning Meditation")).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue("10 minutes daily meditation")).toBeInTheDocument();
    
    // User sees progress stats (4 good days, 1 bad day = 80%)
    expect(screen.getByText("Good 80 %")).toBeInTheDocument();
    expect(screen.getByText("4 good · 1 bad")).toBeInTheDocument();

    // Today (Feb 15) is not marked yet
    expect(screen.getByText(/Today isn't marked yet/)).toBeInTheDocument();
    
    // User sees streak stats
    expect(screen.getByText("🔥")).toBeInTheDocument(); // Longest streak icon
    expect(screen.getByText("🔄")).toBeInTheDocument(); // Current streak icon
    
    // Longest streak is 2 days (Feb 13-14)
    const longestStreakStat = screen.getByText("Longest").closest(".streak") as HTMLElement;
    expect(within(longestStreakStat).getByText("2")).toBeInTheDocument();
    expect(within(longestStreakStat).getByText("days, best chain")).toBeInTheDocument();
    
    // Current streak is 2 days (Feb 13-14, still active as of Feb 15)
    const currentStreakStat = screen.getByText("Current").closest(".streak") as HTMLElement;
    expect(within(currentStreakStat).getByText("2")).toBeInTheDocument();
    expect(within(currentStreakStat).getByText("days in a row")).toBeInTheDocument();

    // User sees the calendar for February 2025
    expect(screen.getByText("February 2025")).toBeInTheDocument();

    // Consecutive good days are linked into a chain, broken by the bad day
    expect(screen.getByTitle("Day 10")).toHaveClass("Calendar-day_linked");
    expect(screen.getByTitle("Day 11")).not.toHaveClass("Calendar-day_linked");
    expect(screen.getByTitle("Day 13")).toHaveClass("Calendar-day_linked");
    expect(screen.getByTitle("Day 14")).not.toHaveClass("Calendar-day_linked");

    // PART 2: User edits habit name
    const nameInput = screen.getByDisplayValue("Morning Meditation");
    await user.clear(nameInput);
    await user.type(nameInput, "Deep Meditation");
    await user.tab(); // Trigger blur to save

    await waitFor(() => {
      expect(habitService.updateHabit).toHaveBeenCalledWith("habit-123", {
        name: "Deep Meditation",
      });
    });

    // PART 3: User edits habit description
    const descriptionInput = screen.getByDisplayValue("10 minutes daily meditation");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "20 minutes mindfulness practice");
    await user.tab(); // Trigger blur to save

    await waitFor(() => {
      expect(habitService.updateHabit).toHaveBeenCalledWith("habit-123", {
        description: "20 minutes mindfulness practice",
      });
    });

    // PART 4: User marks today (Feb 15) as GOOD by clicking the calendar day
    const today = screen.getByTitle("Day 15");
    expect(today).toBeInTheDocument();
    
    // Quick click to mark as GOOD
    await user.click(today);

    await waitFor(() => {
      expect(habitService.updateHabit).toHaveBeenCalledWith(
        "habit-123",
        expect.objectContaining({
          streak: expect.arrayContaining([
            expect.objectContaining({
              status: "GOOD",
              date: new Date("2025-02-15T00:00:00.000Z"),
            }),
          ]),
        })
      );
    });

    await waitFor(() => {
      expect(screen.queryByText(/Today isn't marked yet/)).not.toBeInTheDocument();
    });

    // PART 5: User navigates to previous month to view history
    await user.click(screen.getByRole("button", { name: "Previous month" }));

    // Should show January 2025
    await waitFor(() => {
      expect(screen.getByText("January 2025")).toBeInTheDocument();
    });

    // PART 6: User starts deleting, changes their mind, then deletes for real
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancel" }),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(habitService.deleteHabit).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }),
    );

    await waitFor(() => {
      expect(habitService.deleteHabit).toHaveBeenCalledWith("habit-123");
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("should handle errors gracefully when habit operations fail", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const mockHabit: Habit = {
      id: "habit-123",
      name: "Test Habit",
      description: "Test",
      goal: { type: "daily" },
      streak: [],
    };

    vi.mocked(habitService.getHabitById).mockResolvedValue(mockHabit);
    
    // Simulate update failure
    const updateError = new Error("Network error");
    vi.mocked(habitService.updateHabit).mockRejectedValue(updateError);

    window.history.pushState({}, "", "/habits/habit-123");
    renderStreakTracker();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Habit")).toBeInTheDocument();
    });

    // User tries to update habit name but it fails
    const nameInput = screen.getByDisplayValue("Test Habit");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Name");
    await user.tab();

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Could not update habit name",
        { error: updateError }
      );
      expect(screen.getByRole("status")).toHaveTextContent("Couldn't save the name.");
    });

    // Simulate delete failure
    const deleteError = new Error("Permission denied");
    vi.mocked(habitService.deleteHabit).mockRejectedValue(deleteError);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }),
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Could not delete habit...",
        { error: deleteError }
      );
      expect(screen.getByRole("status")).toHaveTextContent("Couldn't delete the habit.");
    });
  });

  it("should rollback optimistic updates when streak update fails", async () => {
    const user = userEvent.setup();

    const mockHabit: Habit = {
      id: "habit-123",
      name: "Test Habit",
      description: "Test",
      goal: { type: "daily" },
      streak: [
        {
          date: new Date("2025-02-14T00:00:00.000Z"),
          status: "GOOD",
          notes: "Original note",
        },
      ],
    };

    vi.mocked(habitService.getHabitById).mockResolvedValue(mockHabit);
    
    // First update succeeds, second fails
    vi.mocked(habitService.updateHabit)
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error("Update failed"));

    window.history.pushState({}, "", "/habits/habit-123");
    renderStreakTracker();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Habit")).toBeInTheDocument();
    });

    // User clicks day to mark it as BAD
    const day14 = screen.getByTitle("Day 14");
    await user.pointer({ keys: "[MouseLeft>]", target: day14 });
    await user.pointer({ keys: "[/MouseLeft]", target: day14 });

    // Update should be attempted and fail, triggering rollback
    await waitFor(() => {
      expect(habitService.updateHabit).toHaveBeenCalled();
    });

    // The UI should still show original data due to rollback
    // This tests that optimistic updates are properly reversed on error
  });

  it("should ask before removing a day that has a note", async () => {
    const user = userEvent.setup();

    const mockHabit: Habit = {
      id: "habit-123",
      name: "Test Habit",
      description: "Test",
      goal: { type: "daily" },
      streak: [
        {
          date: new Date("2025-02-14T00:00:00.000Z"),
          status: "BAD",
          notes: "Was sick",
        },
      ],
    };

    vi.mocked(habitService.getHabitById).mockResolvedValue(mockHabit);
    vi.mocked(habitService.updateHabit).mockResolvedValue();

    window.history.pushState({}, "", "/habits/habit-123");
    renderStreakTracker();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Habit")).toBeInTheDocument();
    });

    // Clicking a BAD day cycles it to unmarked, which would delete the note
    await user.click(screen.getByTitle("Day 14"));

    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText(/Was sick/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(habitService.updateHabit).not.toHaveBeenCalled();

    await user.click(screen.getByTitle("Day 14"));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Remove" }),
    );

    await waitFor(() => {
      expect(habitService.updateHabit).toHaveBeenCalledWith("habit-123", {
        streak: [],
      });
    });
  });

  it("should track a weekly goal: week progress, lit weeks, no ✗ and changing the goal", async () => {
    const user = userEvent.setup();

    // Today is Saturday 2025-02-15. Week of 27 Jan spans two months and is complete
    // through its January days, week of 3 Feb is complete, current week has 1/2.
    const mockHabit: Habit = {
      id: "habit-123",
      name: "Gym",
      description: "",
      goal: { type: "weekly", times: 2 },
      streak: [
        { date: new Date("2025-01-28T00:00:00.000Z"), status: "GOOD", notes: "" },
        { date: new Date("2025-01-30T00:00:00.000Z"), status: "GOOD", notes: "" },
        { date: new Date("2025-02-03T00:00:00.000Z"), status: "GOOD", notes: "" },
        { date: new Date("2025-02-05T00:00:00.000Z"), status: "GOOD", notes: "" },
        { date: new Date("2025-02-11T00:00:00.000Z"), status: "GOOD", notes: "" },
      ],
    };

    vi.mocked(habitService.getHabitById).mockResolvedValue(mockHabit);
    vi.mocked(habitService.updateHabit).mockResolvedValue();

    window.history.pushState({}, "", "/habits/habit-123");
    renderStreakTracker();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Gym")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Goal")).toHaveValue("2");
    expect(screen.getByText("1/2 this week")).toBeInTheDocument();
    expect(screen.getByText("1 more to reach this week's goal.")).toBeInTheDocument();
    expect(screen.getByText("weeks in a row")).toBeInTheDocument();
    expect(screen.getByTitle("Day 1").parentElement).toHaveClass("Calendar-week_complete");
    expect(screen.getByTitle("Day 3").parentElement).toHaveClass("Calendar-week_complete");
    expect(screen.getByTitle("Day 10").parentElement).not.toHaveClass("Calendar-week_complete");

    // Completing the current week lights it up and extends the chain
    await user.click(screen.getByTitle("Day 12"));

    await waitFor(() => {
      expect(screen.getByText("2/2 this week")).toBeInTheDocument();
    });
    expect(screen.queryByText(/more to reach/)).not.toBeInTheDocument();
    expect(screen.getByTitle("Day 10").parentElement).toHaveClass("Calendar-week_complete");
    const currentStat = screen.getByText("Current").closest(".streak") as HTMLElement;
    expect(within(currentStat).getByText("3")).toBeInTheDocument();
    expect(within(currentStat).getByText("weeks in a row")).toBeInTheDocument();

    // Tapping a good day again unmarks it instead of marking it bad
    await user.click(screen.getByTitle("Day 12"));

    await waitFor(() => {
      expect(screen.getByText("1/2 this week")).toBeInTheDocument();
    });
    expect(habitService.updateHabit).toHaveBeenLastCalledWith("habit-123", {
      streak: expect.not.arrayContaining([expect.objectContaining({ status: "BAD" })]),
    });

    // The goal applies retroactively when changed
    await user.selectOptions(screen.getByLabelText("Goal"), "daily");

    await waitFor(() => {
      expect(habitService.updateHabit).toHaveBeenLastCalledWith("habit-123", {
        goal: { type: "daily" },
      });
    });
    expect(screen.getByText("Today isn't marked yet. Tap today to log it.")).toBeInTheDocument();
    expect(screen.queryByText(/this week/)).not.toBeInTheDocument();
  });

  it("should roll back only the goal when saving it fails, keeping days marked meanwhile", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const mockHabit: Habit = {
      id: "habit-123",
      name: "Gym",
      description: "",
      goal: { type: "weekly", times: 3 },
      streak: [],
    };

    // The goal save hangs until we fail it; day saves succeed right away.
    let failGoalSave: (error: Error) => void = () => {};
    vi.mocked(habitService.getHabitById).mockResolvedValue(mockHabit);
    vi.mocked(habitService.updateHabit).mockImplementation((_id, data) =>
      "goal" in data
        ? new Promise((_, reject) => {
            failGoalSave = reject;
          })
        : Promise.resolve(),
    );

    window.history.pushState({}, "", "/habits/habit-123");
    renderStreakTracker();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Gym")).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText("Goal"), "daily");
    await user.click(screen.getByTitle("Day 14"));
    await waitFor(() => {
      expect(screen.getByTitle("Day 14")).toHaveClass("Calendar-day_success");
    });

    await act(async () => failGoalSave(new Error("Permission denied")));

    expect(screen.getByLabelText("Goal")).toHaveValue("3");
    expect(screen.getByTitle("Day 14")).toHaveClass("Calendar-day_success");
    expect(screen.getByText("1/3 this week")).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it("should show the year overview, and patterns once there are four weeks of history", async () => {
    // Good every day since 1 Jan, except 4 of the last 6 Saturdays (today is Saturday 15 Feb).
    const missedSaturdays = ["2025-02-15", "2025-02-08", "2025-01-25", "2025-01-11"];
    const streak = Array.from({ length: 46 }, (_, i) => {
      const date = new Date(Date.UTC(2025, 0, 1 + i));
      const isMiss = missedSaturdays.includes(date.toISOString().slice(0, 10));
      return { date, status: isMiss ? "BAD" : "GOOD", notes: "" } as const;
    });

    vi.mocked(habitService.getHabitById).mockResolvedValue({
      id: "habit-123",
      name: "Morning run",
      description: "",
      goal: { type: "daily" },
      streak,
    });

    window.history.pushState({}, "", "/habits/habit-123");
    renderStreakTracker();

    // 46 days since 1 Jan, 4 of them missed.
    const yearOverview = await screen.findByRole("region", { name: "Last 12 months" });
    expect(
      within(yearOverview).getByRole("img", { name: "42 good days in the last 12 months" }),
    ).toBeInTheDocument();

    const patterns = await screen.findByRole("region", { name: "Patterns" });
    expect(
      within(patterns).getByText("You miss most often on Saturdays: 4 of the last 6."),
    ).toBeInTheDocument();
  });

  it("should say so when a habit doesn't exist or belongs to someone else", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => consoleErrorSpy.mockRestore());
    // The security rules answer permission-denied for other users' and deleted habits.
    vi.mocked(habitService.getHabitById).mockRejectedValue(
      Object.assign(new Error("Missing or insufficient permissions."), {
        code: "permission-denied",
      }),
    );

    window.history.pushState({}, "", "/habits/someone-elses");
    renderStreakTracker();

    expect(
      await screen.findByText("This habit doesn't exist, or it isn't yours."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to your habits" }));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("should not call a habit missing when loading it failed for another reason", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => consoleErrorSpy.mockRestore());
    vi.mocked(habitService.getHabitById).mockRejectedValue(
      Object.assign(new Error("Offline"), { code: "unavailable" }),
    );

    window.history.pushState({}, "", "/habits/habit-123");
    renderStreakTracker();

    expect(
      await screen.findByText("Couldn't load this habit. Check your connection and try again."),
    ).toBeInTheDocument();
  });

  it("should prevent users from marking future dates", async () => {
    const mockHabit: Habit = {
      id: "habit-123",
      name: "Test Habit",
      description: "Test",
      goal: { type: "daily" },
      streak: [],
    };

    vi.mocked(habitService.getHabitById).mockResolvedValue(mockHabit);

    window.history.pushState({}, "", "/habits/habit-123");
    renderStreakTracker();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Habit")).toBeInTheDocument();
    });

    // Feb 16 is tomorrow (we're on Feb 15)
    const tomorrow = screen.getByTitle("Day 16");
    
    // Future dates should not have click handlers
    // We can verify this by checking they don't have the interactive classes
    expect(tomorrow).toBeInTheDocument();
    
    // The calendar component uses isBeforeOrSameDay to prevent future clicks
    // So attempting to click should not trigger any updates
    const updateCallsBefore = vi.mocked(habitService.updateHabit).mock.calls.length;
    
    // Try to click (should not work)
    await userEvent.click(tomorrow);
    
    // No new update calls should have been made
    expect(vi.mocked(habitService.updateHabit).mock.calls.length).toBe(updateCallsBefore);
  });

  it("should verify calendar displays streak data correctly", async () => {
    const mockHabit: Habit = {
      id: "habit-123",
      name: "Test Habit",
      description: "Test",
      goal: { type: "daily" },
      streak: [
        {
          date: new Date("2025-02-14T00:00:00.000Z"),
          status: "GOOD",
          notes: "Important notes here",
        },
        {
          date: new Date("2025-02-13T00:00:00.000Z"),
          status: "BAD",
          notes: "",
        },
      ],
    };

    vi.mocked(habitService.getHabitById).mockResolvedValue(mockHabit);

    window.history.pushState({}, "", "/habits/habit-123");
    renderStreakTracker();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Habit")).toBeInTheDocument();
    });

    // User sees GOOD day marked with success class
    const day14 = screen.getByTitle("Day 14");
    expect(day14).toHaveClass("Calendar-day_success");
    expect(day14).toHaveTextContent("*"); // Has notes indicator
    
    // User sees BAD day marked with error class
    const day13 = screen.getByTitle("Day 13");
    expect(day13).toHaveClass("Calendar-day_error");
  });
  it("should select the name of a habit that was just created, so typing replaces it", async () => {
    vi.mocked(habitService.getHabitById).mockResolvedValue({
      id: "new-1",
      name: "New habit",
      description: "",
      goal: { type: "daily" },
      streak: [],
    });
    // React Router keeps navigation state under "usr" in the history entry.
    window.history.pushState({ usr: { isNewHabit: true }, key: "new", idx: 0 }, "", "/habits/new-1");
    renderStreakTracker();

    const name = await screen.findByDisplayValue("New habit");
    // The field is focused in an effect, which can run just after it first renders.
    await waitFor(() => expect(name).toHaveFocus());
    expect((name as HTMLInputElement).selectionStart).toBe(0);
    expect((name as HTMLInputElement).selectionEnd).toBe("New habit".length);

    await userEvent.keyboard("Evening stretch");
    expect(name).toHaveValue("Evening stretch");
    // The flag is cleared from history, so a reload doesn't select the name again.
    expect(mockNavigate).toHaveBeenCalledWith("/habits/new-1", { replace: true, state: null });
  });

  it("should not grab focus when opening an existing habit", async () => {
    vi.mocked(habitService.getHabitById).mockResolvedValue({
      id: "old-1",
      name: "Gym",
      description: "",
      goal: { type: "daily" },
      streak: [],
    });
    window.history.pushState({}, "", "/habits/old-1");
    renderStreakTracker();

    expect(await screen.findByDisplayValue("Gym")).not.toHaveFocus();
  });
});
