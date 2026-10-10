import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { habitStatusLine } from "./statusLine";
import type { Habit } from "./Habit";

// Saturday 15 Feb 2025, local noon, so "today" is the 15th in every time zone.
// The week started on Monday 10 Feb, so today and Sunday are left.
beforeAll(() => vi.setSystemTime(new Date(2025, 1, 15, 12)));
afterAll(() => vi.useRealTimers());

const day = (d: number, status: "GOOD" | "BAD" = "GOOD", month = 1) => ({
  date: new Date(Date.UTC(2025, month, d)),
  status,
  notes: "",
});
const range = (from: number, to: number, month = 1) =>
  Array.from({ length: to - from + 1 }, (_, i) => day(from + i, "GOOD", month));
const daily = (...streak: Habit["streak"]): Habit => ({ id: "h", name: "Run", description: "", goal: { type: "daily" }, streak });
const weekly = (times: number, ...streak: Habit["streak"]): Habit => ({ id: "h", name: "Gym", description: "", goal: { type: "weekly", times }, streak });

const lines: string[] = [];
const line = (habit: Habit) => {
  const text = habitStatusLine(habit);
  lines.push(text);
  return text;
};

describe("habitStatusLine - daily habit, not marked yet", () => {
  it("should point out a record within reach", () => {
    expect(line(daily(...range(1, 3), ...range(12, 14)))).toBe("Mark today for a new best");
    expect(line(daily(...range(1, 3), ...range(10, 14)))).toBe("Today extends your record");
  });

  it("should point out a milestone", () => {
    expect(line(daily(...range(9, 14)))).toBe("Today makes it 7 days");
  });

  it("should warn gently on the weekday that tends to slip", () => {
    expect(line(daily(day(25, "BAD", 0), day(1, "BAD"), day(8, "BAD"), day(13), day(14)))).toBe("Saturdays tend to slip");
  });

  it("should otherwise keep the chain, restart, or start", () => {
    expect(line(daily(...range(12, 14)))).toBe("Keep your 3-day chain");
    expect(line(daily(day(13), day(14, "BAD")))).toBe("A fresh start today");
    expect(line(daily())).toBe("Start your first day");
    expect(line(daily(day(1)))).toBe("Not marked today");
  });
});

describe("habitStatusLine - daily habit, done today", () => {
  it("should celebrate a new record only when there was one to beat", () => {
    expect(line(daily(...range(1, 3), ...range(12, 15)))).toBe("New best: 4 days!");
    // The very first chain isn't a new record every day.
    expect(line(daily(...range(12, 15)))).toBe("Day 4 in a row");
    // Equal to the earlier best is not a new best.
    expect(line(daily(...range(1, 3), ...range(13, 15)))).toBe("Day 3 in a row");
  });

  it("should call out milestones and a record within reach", () => {
    expect(line(daily(...range(9, 15)))).toBe("7 days in a row!");
    expect(line(daily(...range(1, 10, 0), ...range(8, 15)))).toBe("Day 8, 2 to your best");
    expect(line(daily(day(15)))).toBe("Day 1 of a new chain");
  });
});

describe("habitStatusLine - daily habit, missed today", () => {
  it("should give perspective instead of guilt", () => {
    expect(line(daily(...range(1, 14), day(15, "BAD")))).toBe("Still 93 % good overall");
    expect(line(daily(day(12), day(13, "BAD"), day(14, "BAD"), day(15, "BAD")))).toBe("Tomorrow is a new day");
  });
});

describe("habitStatusLine - weekly goal", () => {
  it("should celebrate a reached goal, and a run of reached weeks", () => {
    expect(line(weekly(3, day(10), day(12), day(14)))).toBe("This week's goal is done");
    expect(line(weekly(3, day(3), day(5), day(7), day(10), day(12), day(14)))).toBe("Goal met 2 weeks in a row");
  });

  it("should say what's left, knowing how many days the week has left", () => {
    expect(line(weekly(3, day(10), day(15)))).toBe("Nice! 1 more this week");
    expect(line(weekly(2, day(10)))).toBe("1 more this week");
    expect(line(weekly(3, day(10)))).toBe("2 more, every day counts");
    expect(line(weekly(3))).toBe("Tough week, keep going");
  });
});

describe("habitStatusLine - fits the card", () => {
  it("should keep every line short enough for a phone card with two buttons", () => {
    expect(lines.length).toBeGreaterThan(15);
    for (const text of lines) expect(text.length, text).toBeLessThanOrEqual(26);
  });
});
