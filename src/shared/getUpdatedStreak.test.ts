import { describe, it, expect } from "vitest";
import { getUpdatedStreak } from "./getUpdatedStreak";
import { Habit } from "./Habit";

describe("getUpdatedStreak", () => {
  const baseHabit: Habit = {
    id: "habit-1",
    name: "Test Habit",
    description: "Test Description",
    streak: [
      {
        date: new Date("2025-02-08T00:00:00.000Z"),
        status: "GOOD",
        notes: "Good day",
      },
      {
        date: new Date("2025-02-09T00:00:00.000Z"),
        status: "BAD",
        notes: "Bad day",
      },
    ],
  };

  it("should add a new day to streak when date does not exist", () => {
    const result = getUpdatedStreak({
      habit: baseHabit,
      date: new Date("2025-02-10T00:00:00.000Z"),
      status: "GOOD",
    });

    expect(result.streak).toHaveLength(3);
    expect(result.streak[2]).toEqual({
      date: new Date("2025-02-10T00:00:00.000Z"),
      status: "GOOD",
      notes: "",
    });
    expect(result.previousStreak).toEqual(baseHabit.streak);
  });

  it("should add a new day with notes", () => {
    const result = getUpdatedStreak({
      habit: baseHabit,
      date: new Date("2025-02-10T00:00:00.000Z"),
      status: "GOOD",
      notes: "Great progress!",
    });

    expect(result.streak).toHaveLength(3);
    expect(result.streak[2]).toEqual({
      date: new Date("2025-02-10T00:00:00.000Z"),
      status: "GOOD",
      notes: "",
    });
  });

  it("should update existing day status and clear notes if not provided", () => {
    const result = getUpdatedStreak({
      habit: baseHabit,
      date: new Date("2025-02-08T00:00:00.000Z"),
      status: "BAD",
    });

    expect(result.streak).toHaveLength(2);
    expect(result.streak[0]).toEqual({
      date: new Date("2025-02-08T00:00:00.000Z"),
      status: "BAD",
      notes: "",
    });
  });

  it("should update existing day notes", () => {
    const result = getUpdatedStreak({
      habit: baseHabit,
      date: new Date("2025-02-08T00:00:00.000Z"),
      status: "GOOD",
      notes: "Updated notes",
    });

    expect(result.streak).toHaveLength(2);
    expect(result.streak[0]).toEqual({
      date: new Date("2025-02-08T00:00:00.000Z"),
      status: "GOOD",
      notes: "Updated notes",
    });
  });

  it("should update both status and notes for existing day", () => {
    const result = getUpdatedStreak({
      habit: baseHabit,
      date: new Date("2025-02-09T00:00:00.000Z"),
      status: "GOOD",
      notes: "Actually it was good",
    });

    expect(result.streak).toHaveLength(2);
    expect(result.streak[1]).toEqual({
      date: new Date("2025-02-09T00:00:00.000Z"),
      status: "GOOD",
      notes: "Actually it was good",
    });
  });

  it("should remove day when status is NOT_SPECIFIED", () => {
    const result = getUpdatedStreak({
      habit: baseHabit,
      date: new Date("2025-02-08T00:00:00.000Z"),
      status: "NOT_SPECIFIED",
    });

    expect(result.streak).toHaveLength(1);
    expect(result.streak[0]).toEqual({
      date: new Date("2025-02-09T00:00:00.000Z"),
      status: "BAD",
      notes: "Bad day",
    });
  });

  it("should handle removing a non-existent day gracefully", () => {
    const result = getUpdatedStreak({
      habit: baseHabit,
      date: new Date("2025-02-10T00:00:00.000Z"),
      status: "NOT_SPECIFIED",
    });

    expect(result.streak).toHaveLength(2);
    expect(result.streak).toEqual(baseHabit.streak);
  });

  it("should handle empty streak", () => {
    const emptyHabit: Habit = {
      ...baseHabit,
      streak: [],
    };

    const result = getUpdatedStreak({
      habit: emptyHabit,
      date: new Date("2025-02-10T00:00:00.000Z"),
      status: "GOOD",
    });

    expect(result.streak).toHaveLength(1);
    expect(result.streak[0]).toEqual({
      date: new Date("2025-02-10T00:00:00.000Z"),
      status: "GOOD",
      notes: "",
    });
  });

  it("should preserve other days when updating one day", () => {
    const multiDayHabit: Habit = {
      ...baseHabit,
      streak: [
        {
          date: new Date("2025-02-07T00:00:00.000Z"),
          status: "GOOD",
          notes: "Day 1",
        },
        {
          date: new Date("2025-02-08T00:00:00.000Z"),
          status: "GOOD",
          notes: "Day 2",
        },
        {
          date: new Date("2025-02-09T00:00:00.000Z"),
          status: "GOOD",
          notes: "Day 3",
        },
      ],
    };

    const result = getUpdatedStreak({
      habit: multiDayHabit,
      date: new Date("2025-02-08T00:00:00.000Z"),
      status: "BAD",
      notes: "Changed my mind",
    });

    expect(result.streak).toHaveLength(3);
    expect(result.streak[0]).toEqual({
      date: new Date("2025-02-07T00:00:00.000Z"),
      status: "GOOD",
      notes: "Day 1",
    });
    expect(result.streak[1]).toEqual({
      date: new Date("2025-02-08T00:00:00.000Z"),
      status: "BAD",
      notes: "Changed my mind",
    });
    expect(result.streak[2]).toEqual({
      date: new Date("2025-02-09T00:00:00.000Z"),
      status: "GOOD",
      notes: "Day 3",
    });
  });

  it("should return previousStreak for rollback capability", () => {
    const result = getUpdatedStreak({
      habit: baseHabit,
      date: new Date("2025-02-10T00:00:00.000Z"),
      status: "GOOD",
    });

    expect(result.previousStreak).toEqual(baseHabit.streak);
    expect(result.previousStreak).not.toBe(result.streak);
  });
});
