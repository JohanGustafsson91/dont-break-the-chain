import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  markDay,
  calculateCurrentStreak,
  calculateLongestStreak,
  getGoodDays,
  getBadDays,
  type Habit,
} from "./Habit";
import { HABIT_STATUS } from "../shared/constants";

describe("Domain - Habit tracking complete workflows", () => {
  beforeAll(() => {
    vi.setSystemTime(new Date("2025-02-15T00:00:00Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  const createHabit = (streakData: Array<{ date: string; status: keyof typeof HABIT_STATUS; notes?: string }>): Habit => ({
    id: "test-habit",
    name: "Test Habit",
    description: "Test Description",
    streak: streakData.map((s) => ({
      date: new Date(s.date),
      status: HABIT_STATUS[s.status],
      notes: s.notes || "",
    })),
  });

  describe("markDay - Complete habit tracking workflow", () => {
    it("should handle complete daily tracking workflow: add, update, remove entries", () => {
      let habit = createHabit([]);

      // User starts new habit and marks first day as GOOD
      habit = markDay(habit, new Date("2025-02-10"), HABIT_STATUS.GOOD, "First day!");
      expect(habit.streak).toHaveLength(1);
      expect(habit.streak[0]).toEqual({
        date: new Date("2025-02-10"),
        status: HABIT_STATUS.GOOD,
        notes: "First day!",
      });

      // User marks second day as GOOD (consecutive streak)
      habit = markDay(habit, new Date("2025-02-11"), HABIT_STATUS.GOOD, "Going strong");
      expect(habit.streak).toHaveLength(2);
      expect(getGoodDays(habit)).toHaveLength(2);

      // User had a bad day and marks it accordingly
      habit = markDay(habit, new Date("2025-02-12"), HABIT_STATUS.BAD, "Rough day");
      expect(habit.streak).toHaveLength(3);
      expect(getBadDays(habit)).toHaveLength(1);

      // User changes their mind about the bad day (update existing entry)
      habit = markDay(habit, new Date("2025-02-12"), HABIT_STATUS.GOOD, "Actually did it!");
      expect(habit.streak).toHaveLength(3);
      expect(getBadDays(habit)).toHaveLength(0);
      expect(getGoodDays(habit)).toHaveLength(3);

      // User removes entry completely (NOT_SPECIFIED)
      habit = markDay(habit, new Date("2025-02-12"), HABIT_STATUS.NOT_SPECIFIED);
      expect(habit.streak).toHaveLength(2);
      expect(habit.streak.find(s => s.date.getTime() === new Date("2025-02-12").getTime())).toBeUndefined();
    });

    it("should handle edge cases: same day updates, date normalization", () => {
      let habit = createHabit([]);

      // Mark day with different time components - should normalize to same day
      const sameDay1 = new Date("2025-02-10T08:30:00Z");
      const sameDay2 = new Date("2025-02-10T22:15:00Z");
      
      habit = markDay(habit, sameDay1, HABIT_STATUS.GOOD, "Morning");
      habit = markDay(habit, sameDay2, HABIT_STATUS.BAD, "Evening update");

      // Should have only one entry for the day (updated, not added)
      expect(habit.streak).toHaveLength(1);
      expect(habit.streak[0].status).toBe(HABIT_STATUS.BAD);
      expect(habit.streak[0].notes).toBe("Evening update");
    });
  });

  describe("Streak calculations - Complete user scenarios", () => {
    it("should handle user journey: building streaks, breaks, and comeback", () => {
      // User builds initial 3-day streak
      const habit = createHabit([
        { date: "2025-02-10", status: "GOOD" },
        { date: "2025-02-11", status: "GOOD" },
        { date: "2025-02-12", status: "GOOD" },
        // User breaks streak with a bad day
        { date: "2025-02-13", status: "BAD" },
        // User comes back and starts new streak
        { date: "2025-02-14", status: "GOOD" },
        { date: "2025-02-15", status: "GOOD" }, // Today - active streak
      ]);

      const currentStreak = calculateCurrentStreak(habit);
      const longestStreak = calculateLongestStreak(habit);

      // Current streak: 2 days (Feb 14-15)
      expect(currentStreak.count).toBe(2);
      expect(currentStreak.from).toEqual(new Date("2025-02-14"));
      expect(currentStreak.to).toEqual(new Date("2025-02-15"));

      // Longest streak: 3 days (Feb 10-12)
      expect(longestStreak.count).toBe(3);
      expect(longestStreak.from).toEqual(new Date("2025-02-10"));
      expect(longestStreak.to).toEqual(new Date("2025-02-12"));
    });

    it("should handle yesterday's streak as still active (grace period)", () => {
      // User has streak until yesterday
      const habit = createHabit([
        { date: "2025-02-12", status: HABIT_STATUS.GOOD },
        { date: "2025-02-13", status: HABIT_STATUS.GOOD },
        { date: "2025-02-14", status: HABIT_STATUS.GOOD }, // Yesterday - should still be active
      ]);

      const currentStreak = calculateCurrentStreak(habit);
      
      // Streak from yesterday should still count as "current"
      expect(currentStreak.count).toBe(3);
      expect(currentStreak.from).toEqual(new Date("2025-02-12"));
      expect(currentStreak.to).toEqual(new Date("2025-02-14"));
    });

    it("should break current streak if today is marked as BAD", () => {
      const habit = createHabit([
        { date: "2025-02-13", status: HABIT_STATUS.GOOD },
        { date: "2025-02-14", status: HABIT_STATUS.GOOD },
        { date: "2025-02-15", status: HABIT_STATUS.BAD }, // Today is bad - breaks streak
      ]);

      const currentStreak = calculateCurrentStreak(habit);
      
      // Bad day today should break the streak
      expect(currentStreak.count).toBe(0);
      expect(currentStreak.from).toBeUndefined();
      expect(currentStreak.to).toBeUndefined();
    });

    it("should handle no streak data (new user)", () => {
      const habit = createHabit([]);

      const currentStreak = calculateCurrentStreak(habit);
      const longestStreak = calculateLongestStreak(habit);

      expect(currentStreak.count).toBe(0);
      expect(currentStreak.from).toBeUndefined();
      expect(currentStreak.to).toBeUndefined();

      expect(longestStreak.count).toBe(0);
      expect(longestStreak.from).toBeUndefined();
      expect(longestStreak.to).toBeUndefined();
    });

    it("should handle only bad days (no streaks possible)", () => {
      const habit = createHabit([
        { date: "2025-02-10", status: HABIT_STATUS.BAD },
        { date: "2025-02-11", status: HABIT_STATUS.BAD },
        { date: "2025-02-12", status: HABIT_STATUS.BAD },
      ]);

      const currentStreak = calculateCurrentStreak(habit);
      const longestStreak = calculateLongestStreak(habit);

      expect(currentStreak.count).toBe(0);
      expect(longestStreak.count).toBe(0);
    });

    it("should handle gaps in dates (non-consecutive good days)", () => {
      const habit = createHabit([
        { date: "2025-02-10", status: HABIT_STATUS.GOOD }, // Single day
        { date: "2025-02-12", status: HABIT_STATUS.GOOD }, // Gap (Feb 11 missing)
        { date: "2025-02-13", status: HABIT_STATUS.GOOD }, // Consecutive with Feb 12
        { date: "2025-02-15", status: HABIT_STATUS.GOOD }, // Gap (Feb 14 missing) - Today
      ]);

      const currentStreak = calculateCurrentStreak(habit);
      const longestStreak = calculateLongestStreak(habit);

      // Current streak: just today (Feb 15)
      expect(currentStreak.count).toBe(1);
      expect(currentStreak.from).toEqual(new Date("2025-02-15"));

      // Longest streak: Feb 12-13 (2 days)
      expect(longestStreak.count).toBe(2);
      expect(longestStreak.from).toEqual(new Date("2025-02-12"));
      expect(longestStreak.to).toEqual(new Date("2025-02-13"));
    });

    it("should handle multiple equal-length streaks (picks first longest)", () => {
      const habit = createHabit([
        // First 2-day streak
        { date: "2025-02-10", status: HABIT_STATUS.GOOD },
        { date: "2025-02-11", status: HABIT_STATUS.GOOD },
        { date: "2025-02-12", status: HABIT_STATUS.BAD }, // Break
        // Second 2-day streak  
        { date: "2025-02-13", status: HABIT_STATUS.GOOD },
        { date: "2025-02-14", status: HABIT_STATUS.GOOD },
      ]);

      const longestStreak = calculateLongestStreak(habit);

      // Should return the first occurrence of the longest streak
      expect(longestStreak.count).toBe(2);
      expect(longestStreak.from).toEqual(new Date("2025-02-10"));
      expect(longestStreak.to).toEqual(new Date("2025-02-11"));
    });
  });

  describe("Helper functions - getGoodDays and getBadDays", () => {
    it("should correctly filter good and bad days", () => {
      const habit = createHabit([
        { date: "2025-02-10", status: HABIT_STATUS.GOOD },
        { date: "2025-02-11", status: HABIT_STATUS.BAD },
        { date: "2025-02-12", status: HABIT_STATUS.GOOD },
        { date: "2025-02-13", status: HABIT_STATUS.BAD },
      ]);

      const goodDays = getGoodDays(habit);
      const badDays = getBadDays(habit);

      expect(goodDays).toHaveLength(2);
      expect(badDays).toHaveLength(2);
      expect(goodDays.every(day => day.status === HABIT_STATUS.GOOD)).toBe(true);
      expect(badDays.every(day => day.status === HABIT_STATUS.BAD)).toBe(true);
    });
  });
});