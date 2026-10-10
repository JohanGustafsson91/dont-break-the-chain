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
    expect(line(daily(...range(1, 3), ...range(12, 14)))).toBe("Beat your best today 🏆");
    // Beyond the record: the next milestone (7) is near, so that comes first.
    expect(line(daily(...range(1, 3), ...range(10, 14)))).toBe("2 days to 7 in a row 🎯");
    expect(line(daily(...range(1, 3), ...range(5, 14)))).toBe("On a record run 🏆");
  });

  it("should point out a milestone today, or one coming up", () => {
    expect(line(daily(...range(9, 14)))).toBe("Today is day 7 🎯");
    expect(line(daily(...range(4, 14, 0), ...range(1, 14)))).toBe("On a record run 🏆");
    // 11 days so far, so 3 more to 14 (no earlier record to talk about).
    expect(line(daily(...range(4, 14)))).toBe("3 days to 14 in a row 🎯");
  });

  it("should not let a miss become two", () => {
    expect(line(daily(day(13), day(14, "BAD")))).toBe("Don't miss twice 💪");
  });

  it("should warn gently on the weekday that tends to slip", () => {
    expect(line(daily(day(25, "BAD", 0), day(1, "BAD"), day(8, "BAD"), day(13), day(14)))).toBe("Saturdays tend to slip");
  });

  it("should count a new habit's first week", () => {
    const fresh = { ...daily(day(12), day(13)), createdAt: new Date(Date.UTC(2025, 1, 12, 9)) };
    expect(line(fresh)).toBe("First week: 2 of 7 done 🌱");
  });

  it("should otherwise keep the chain, pick it back up, or start", () => {
    expect(line(daily(...range(12, 14)))).toBe("3 days, keep going 🔗");
    expect(line(daily(day(1)))).toBe("Last done 14 days ago");
    expect(line(daily())).toBe("Start your first day 🌱");
  });
});

describe("habitStatusLine - daily habit, done today", () => {
  it("should celebrate a new record only when there was one to beat", () => {
    expect(line(daily(...range(1, 3), ...range(12, 15)))).toBe("New best: 4 days 🏆");
    // The very first chain isn't a new record every day.
    expect(line(daily(...range(12, 15)))).toBe("Day 4, 3 to 7 🎯");
  });

  it("should call out milestones, the record and the next milestone", () => {
    expect(line(daily(...range(9, 15)))).toBe("7 days in a row 🎉");
    expect(line(daily(...range(1, 10, 0), ...range(8, 15)))).toBe("Day 8, 2 to your best 🎯");
    expect(line(daily(...range(1, 15), ...range(16, 31, 0)))).toBe("Day 31 in a row 🔗");
  });

  it("should recognise getting back on track after a miss", () => {
    expect(line(daily(day(13), day(14, "BAD"), day(15)))).toBe("Back on track 💪");
    expect(line(daily(day(15)))).toBe("Day 1 of a new chain 🌱");
  });
});

describe("habitStatusLine - long chains", () => {
  // A chain of n days ending on `endDay` (today is the 15th).
  const chain = (n: number, endDay: number) =>
    Array.from({ length: n }, (_, i) => ({
      date: new Date(Date.UTC(2025, 1, endDay - (n - 1) + i)),
      status: "GOOD" as const,
      notes: "",
    }));

  it("should not call every day of an all-time-best chain a new record", () => {
    // 910 days, all of it the longest chain ever: a record run, not a new best each day.
    expect(line(daily(...chain(910, 15)))).toBe("Day 910 in a row 🔗");
    expect(line(daily(...chain(910, 14)))).toBe("910 days, keep going 🔗");
    // A milestone beats the record wording, done or not.
    expect(line(daily(...chain(1000, 15)))).toBe("1000 days in a row 🎉");
    expect(line(daily(...chain(999, 14)))).toBe("Today is day 1000 🎯");
  });

  it("should keep finding milestones after a year: 500, 1000 and every full year", () => {
    expect(line(daily(...chain(500, 15)))).toBe("500 days in a row 🎉");
    expect(line(daily(...chain(1000, 15)))).toBe("1000 days in a row 🎉");
    expect(line(daily(...chain(365, 15)))).toBe("1 year in a row 🎉");
    expect(line(daily(...chain(730, 15)))).toBe("2 years in a row 🎉");
  });

  it("should point to the next one, even far beyond a year", () => {
    expect(line(daily(...chain(729, 14)))).toBe("Today makes 2 years 🎯");
    expect(line(daily(...chain(999, 14)))).toBe("Today is day 1000 🎯");
    // 910 days: 1000 is still 90 days away, so no countdown yet.
    expect(line(daily(...chain(910, 14)))).toBe("910 days, keep going 🔗");
    expect(line(daily(...chain(997, 15)))).toBe("Day 997, 3 to 1000 🎯");
    expect(line(daily(...chain(1092, 14)))).toBe("3 days to 1095 in a row 🎯");
  });
});

describe("habitStatusLine - daily habit, missed today", () => {
  const misses = (...comebacks: ("GOOD" | "BAD")[]) =>
    comebacks.flatMap((next, i) => [day(1 + i * 2, "BAD"), day(2 + i * 2, next)]);

  it("should show the user's own comeback rate", () => {
    expect(line(daily(...misses("GOOD", "GOOD", "GOOD", "GOOD", "GOOD"), day(15, "BAD")))).toBe("You always bounce back");
    expect(line(daily(...misses("GOOD", "GOOD", "GOOD", "GOOD", "BAD"), day(15, "BAD")))).toBe("You recover 8 in 10 times");
  });

  it("should otherwise give perspective, or the one rule that matters", () => {
    expect(line(daily(...range(1, 14), day(15, "BAD")))).toBe("Still 93 % good overall");
    expect(line(daily(day(12), day(13, "BAD"), day(14, "BAD"), day(15, "BAD")))).toBe("One miss is fine 🌱");
  });
});

describe("habitStatusLine - weekly goal", () => {
  it("should celebrate a reached goal, with days to spare or a run of weeks", () => {
    expect(line(weekly(3, day(10), day(12), day(14)))).toBe("Done, 1 day to spare ✅");
    expect(line(weekly(3, day(3), day(5), day(7), day(10), day(12), day(14)))).toBe("Goal met 2 weeks in a row 🏆");
  });

  it("should say what's left, knowing how many days the week has left", () => {
    expect(line(weekly(3, day(10), day(15)))).toBe("Nice, 1 more this week 💪");
    expect(line(weekly(2, day(10)))).toBe("1 more this week");
    expect(line(weekly(3, day(10)))).toBe("2 more, every day counts 🎯");
    expect(line(weekly(3))).toBe("Every extra day counts");
  });
});

describe("habitStatusLine - fits the card", () => {
  it("should keep every line short enough for a phone card with two buttons", () => {
    expect(lines.length).toBeGreaterThan(20);
    // Characters, not UTF-16 units, so an emoji counts once.
    for (const text of lines) expect([...text].length, text).toBeLessThanOrEqual(28);
    // At most one emoji, at the end.
    for (const text of lines) expect(text.match(/\p{Extended_Pictographic}/gu)?.length ?? 0, text).toBeLessThanOrEqual(1);
  });
});
