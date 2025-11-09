import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { findStreaks } from "./findStreaks";
import { DayInStreak } from "./Habit";

beforeAll(() => {
  vi.setSystemTime(new Date("2025-02-10T00:00:00Z"));
});

afterAll(() => {
  vi.useRealTimers();
});

describe("findStreaks", () => {
  it("should return zero streaks when dates array is empty", () => {
    const result = findStreaks([]);

    expect(result.longestStreak.streak).toBe(0);
    expect(result.currentStreak.streak).toBe(0);
  });

  it("should return zero streaks when there are no GOOD days", () => {
    const dates: DayInStreak[] = [
      {
        date: new Date("2025-02-09T00:00:00.000Z"),
        status: "BAD",
        notes: "",
      },
      {
        date: new Date("2025-02-08T00:00:00.000Z"),
        status: "BAD",
        notes: "",
      },
    ];

    const result = findStreaks(dates);

    expect(result.longestStreak.streak).toBe(0);
    expect(result.currentStreak.streak).toBe(0);
  });

  it("should calculate a single day streak", () => {
    const dates: DayInStreak[] = [
      {
        date: new Date("2025-02-09T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
    ];

    const result = findStreaks(dates);

    expect(result.longestStreak.streak).toBe(1);
    expect(result.currentStreak.streak).toBe(1);
    expect(result.longestStreak.from.toISOString()).toBe(
      "2025-02-09T00:00:00.000Z",
    );
    expect(result.longestStreak.to.toISOString()).toBe(
      "2025-02-09T00:00:00.000Z",
    );
  });

  it("should calculate consecutive streaks", () => {
    const dates: DayInStreak[] = [
      {
        date: new Date("2025-02-09T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-08T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-07T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
    ];

    const result = findStreaks(dates);

    expect(result.longestStreak.streak).toBe(3);
    expect(result.currentStreak.streak).toBe(3);
    expect(result.longestStreak.from.toISOString()).toBe(
      "2025-02-07T00:00:00.000Z",
    );
    expect(result.longestStreak.to.toISOString()).toBe(
      "2025-02-09T00:00:00.000Z",
    );
  });

  it("should find the longest streak when there are multiple streaks", () => {
    const dates: DayInStreak[] = [
      // Streak 1: 2 days
      {
        date: new Date("2025-02-01T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-02T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      // Gap
      {
        date: new Date("2025-02-04T00:00:00.000Z"),
        status: "BAD",
        notes: "",
      },
      // Streak 2: 4 days (longest)
      {
        date: new Date("2025-02-05T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-06T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-07T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-08T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
    ];

    const result = findStreaks(dates);

    expect(result.longestStreak.streak).toBe(4);
    expect(result.longestStreak.from.toISOString()).toBe(
      "2025-02-05T00:00:00.000Z",
    );
    expect(result.longestStreak.to.toISOString()).toBe(
      "2025-02-08T00:00:00.000Z",
    );
  });

  it("should identify current streak when it ends today", () => {
    const dates: DayInStreak[] = [
      {
        date: new Date("2025-02-08T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-09T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-10T00:00:00.000Z"), // Today
        status: "GOOD",
        notes: "",
      },
    ];

    const result = findStreaks(dates);

    expect(result.currentStreak.streak).toBe(3);
    expect(result.longestStreak.streak).toBe(3);
  });

  it("should identify current streak when it ends yesterday", () => {
    const dates: DayInStreak[] = [
      {
        date: new Date("2025-02-07T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-08T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-09T00:00:00.000Z"), // Yesterday
        status: "GOOD",
        notes: "",
      },
    ];

    const result = findStreaks(dates);

    expect(result.currentStreak.streak).toBe(3);
    expect(result.longestStreak.streak).toBe(3);
  });

  it("should not identify current streak when it ended 2 days ago", () => {
    const dates: DayInStreak[] = [
      {
        date: new Date("2025-02-06T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-07T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-08T00:00:00.000Z"), // 2 days ago
        status: "GOOD",
        notes: "",
      },
    ];

    const result = findStreaks(dates);

    expect(result.currentStreak.streak).toBe(0);
    expect(result.longestStreak.streak).toBe(3);
  });

  it("should not count current streak if there is a BAD day today", () => {
    const dates: DayInStreak[] = [
      {
        date: new Date("2025-02-08T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-09T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-10T00:00:00.000Z"), // Today - BAD
        status: "BAD",
        notes: "",
      },
    ];

    const result = findStreaks(dates);

    expect(result.currentStreak.streak).toBe(0);
    expect(result.longestStreak.streak).toBe(2);
  });

  it("should handle non-consecutive good days", () => {
    const dates: DayInStreak[] = [
      {
        date: new Date("2025-02-01T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-03T00:00:00.000Z"), // Gap - not consecutive
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-05T00:00:00.000Z"), // Gap - not consecutive
        status: "GOOD",
        notes: "",
      },
    ];

    const result = findStreaks(dates);

    expect(result.longestStreak.streak).toBe(1);
    expect(result.currentStreak.streak).toBe(0);
  });

  it("should handle unsorted dates correctly", () => {
    const dates: DayInStreak[] = [
      {
        date: new Date("2025-02-09T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-07T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-08T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
    ];

    const result = findStreaks(dates);

    expect(result.currentStreak.streak).toBe(3);
    expect(result.longestStreak.streak).toBe(3);
    expect(result.longestStreak.from.toISOString()).toBe(
      "2025-02-07T00:00:00.000Z",
    );
    expect(result.longestStreak.to.toISOString()).toBe(
      "2025-02-09T00:00:00.000Z",
    );
  });

  it("should handle mixed GOOD and BAD days with multiple streaks", () => {
    const dates: DayInStreak[] = [
      {
        date: new Date("2025-02-01T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-02T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-03T00:00:00.000Z"),
        status: "BAD",
        notes: "",
      },
      {
        date: new Date("2025-02-04T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-05T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
      {
        date: new Date("2025-02-06T00:00:00.000Z"),
        status: "GOOD",
        notes: "",
      },
    ];

    const result = findStreaks(dates);

    expect(result.longestStreak.streak).toBe(3);
    expect(result.longestStreak.from.toISOString()).toBe(
      "2025-02-04T00:00:00.000Z",
    );
    expect(result.longestStreak.to.toISOString()).toBe(
      "2025-02-06T00:00:00.000Z",
    );
  });
});
