import { describe, it, expect } from "vitest";
import { getInsights, recoveryInsight } from "./insights";
import type { Goal, Habit } from "./Habit";
import { HABIT_STATUS } from "../shared/constants";

// Sunday. Every history below ends on this day.
const NOW = new Date("2025-03-30T00:00:00Z");
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

type Mark = "good" | "bad" | undefined;

const habitWithHistory = (
  days: number,
  markFor: (daysAgo: number, date: Date) => Mark,
  goal: Goal = { type: "daily" },
): Habit => ({
  id: "habit",
  name: "Habit",
  description: "",
  goal,
  streak: Array.from({ length: days }, (_, daysAgo) => {
    const date = new Date(NOW.getTime() - daysAgo * ONE_DAY_IN_MS);
    const mark = markFor(daysAgo, date);
    return mark
      ? {
          date,
          status: mark === "good" ? HABIT_STATUS.GOOD : HABIT_STATUS.BAD,
          notes: "",
        }
      : undefined;
  }).filter((day) => day !== undefined),
});

describe("Insights - patterns found in a habit's history", () => {
  it("should stay quiet until there are four weeks of history", () => {
    const threeWeeksOfMisses = habitWithHistory(21, (daysAgo) =>
      daysAgo % 2 ? "bad" : "good",
    );

    expect(getInsights(habitWithHistory(0, () => "good"), NOW)).toEqual([]);
    expect(getInsights(threeWeeksOfMisses, NOW)).toEqual([]);
  });

  it("should point out the weekday you usually miss and where chains break", () => {
    // Good every day except 4 of the last 6 Sundays.
    const habit = habitWithHistory(56, (daysAgo, date) =>
      date.getUTCDay() === 0 && [0, 7, 21, 35].includes(daysAgo) ? "bad" : "good",
    );

    expect(getInsights(habit, NOW)).toEqual([
      "You miss most often on Sundays: 4 of the last 6.",
      "Your chains usually break after 6–13 days.",
    ]);
  });

  it("should not single out a weekday when you miss every day", () => {
    const habit = habitWithHistory(35, () => "bad");

    expect(getInsights(habit, NOW)).toEqual([]);
  });

  it("should encourage with how often a bad day is followed by a good one", () => {
    // Bad every fourth day, then good, except one double miss: 9 of 10.
    const recovering = habitWithHistory(40, (daysAgo) =>
      daysAgo === 13 || daysAgo % 4 === 0 ? "bad" : "good",
    );
    // Misses come in pairs, so fewer than half recover (7 of 15): not encouraging, so hidden.
    const clustered = habitWithHistory(40, (daysAgo) =>
      daysAgo % 5 <= 1 ? "bad" : "good",
    );

    expect(recoveryInsight(recovering)).toBe(
      "After a bad day, the next day is good 90 % of the time.",
    );
    expect(recoveryInsight(clustered)).toBeUndefined();
  });

  it("should prefer the weekday and the trend when every insight applies", () => {
    // Sundays are always missed. The 30 days before also had Thursday misses.
    const habit = habitWithHistory(63, (daysAgo) =>
      daysAgo % 7 === 0 || (daysAgo >= 30 && daysAgo % 7 === 3) ? "bad" : "good",
    );

    expect(getInsights(habit, NOW)).toEqual([
      "You miss most often on Sundays: 6 of the last 6.",
      "83 % good days in the last 30 days, up from 70 %.",
    ]);
  });

  it("should compare the last 30 days with the 30 before", () => {
    // Last 30 days: all good. Previous 30 days: one 5-day chain and 5 misses (50 %).
    // Misses are followed by unmarked days, so no other insight competes.
    const improving = habitWithHistory(60, (daysAgo) =>
      daysAgo < 30 || (daysAgo >= 31 && daysAgo <= 35)
        ? "good"
        : [40, 43, 46, 49, 52].includes(daysAgo)
          ? "bad"
          : undefined,
    );
    // Same share in both windows: no trend worth mentioning.
    const steady = habitWithHistory(60, () => "good");

    expect(getInsights(improving, NOW)).toEqual([
      "100 % good days in the last 30 days, up from 50 %.",
    ]);
    expect(getInsights(steady, NOW)).toEqual([]);
  });

  it("should only show the trend for weekly goals, counted in good days", () => {
    // Last 30 days: 5 good days. Previous 30 days: 9 good days. Misses on Sundays.
    const habit = habitWithHistory(
      60,
      (daysAgo, date) =>
        date.getUTCDay() === 0
          ? "bad"
          : daysAgo % (daysAgo < 30 ? 7 : 3) === 1
            ? "good"
            : undefined,
      { type: "weekly", times: 3 },
    );

    expect(getInsights(habit, NOW)).toEqual([
      "5 good days in the last 30 days, down from 9.",
    ]);
  });
});
