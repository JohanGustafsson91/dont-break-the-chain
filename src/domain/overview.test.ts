import { describe, it, expect } from "vitest";
import { buildOverview } from "./overview";
import type { Goal, Habit, StreakDay } from "./Habit";
import { HABIT_STATUS } from "../shared/constants";
import { createDate } from "../utils/date";

// Saturday 10 October 2026: this week runs Monday 5 to Sunday 11.
const TODAY = createDate("2026-10-10");

const day = (iso: string, status: StreakDay["status"]): StreakDay => ({ date: createDate(iso), status, notes: "" });
const habit = (id: string, streak: StreakDay[], extra: { goal?: Goal; createdAt?: Date } = {}): Habit => ({
  id,
  name: id,
  description: "",
  goal: extra.goal ?? { type: "daily" },
  streak,
  createdAt: extra.createdAt,
});
const iso = (d: Date) => d.toISOString().slice(0, 10);

describe("buildOverview", () => {
  it("should show whole weeks, Monday first, ending this week", () => {
    const { weeks } = buildOverview([], 2, 0, TODAY);

    expect(weeks.map((w) => [iso(w[0]), iso(w[6])])).toEqual([
      ["2026-09-28", "2026-10-04"],
      ["2026-10-05", "2026-10-11"],
    ]);
    expect(buildOverview([], 4, 0, TODAY).weeks[0].map(iso)[0]).toBe("2026-09-14");
    expect(buildOverview([], 2, 1, TODAY).weeks.map((w) => iso(w[0]))).toEqual(["2026-09-14", "2026-09-21"]);
  });

  it("should mark each day's status, today and the days still to come", () => {
    const run = habit("run", [day("2026-10-09", HABIT_STATUS.GOOD), day("2026-10-08", HABIT_STATUS.BAD)]);
    const [week2] = buildOverview([run], 2, 0, TODAY).rows[0].weeks.slice(1);

    expect(week2.map((c) => c.status)).toEqual(["NOT_SPECIFIED", "NOT_SPECIFIED", "NOT_SPECIFIED", "BAD", "GOOD", "NOT_SPECIFIED", "NOT_SPECIFIED"]);
    expect(week2.map((c) => c.isToday)).toEqual([false, false, false, false, false, true, false]);
    expect(week2.map((c) => c.isFuture)).toEqual([false, false, false, false, false, false, true]);
  });

  it("should count daily habits' days up to yesterday, today once marked, and nothing before a habit began", () => {
    const run = habit("run", [day("2026-10-09", HABIT_STATUS.GOOD), day("2026-10-10", HABIT_STATUS.GOOD)], {
      // Created Wednesday morning, local time.
      createdAt: new Date(2026, 9, 7, 8, 0),
    });
    const read = habit("read", [day("2026-10-09", HABIT_STATUS.GOOD)], { createdAt: new Date(2026, 9, 9, 8, 0) });
    const gym = habit("gym", [day("2026-10-09", HABIT_STATUS.GOOD)], { goal: { type: "weekly", times: 3 } });

    const overview = buildOverview([run, read, gym], 2, 0, TODAY);

    // run: Wed–Sat = 4 days (2 done); read: Fri only, today unmarked = 1 day (1 done); gym is weekly.
    expect({ done: overview.done, counted: overview.counted }).toEqual({ done: 3, counted: 5 });
    expect(overview.rows[0].weeks[1].map((c) => c.isBeforeStart)).toEqual([true, true, false, false, false, false, false]);
  });

  it("should show and count days marked before the habit was created", () => {
    // Created on Friday, then last Monday was filled in from the calendar.
    const run = habit("run", [day("2026-10-05", HABIT_STATUS.GOOD)], { createdAt: new Date(2026, 9, 9, 8, 0) });
    const overview = buildOverview([run], 2, 0, TODAY);

    expect(overview.rows[0].weeks[1].map((c) => c.isBeforeStart)).toEqual([false, false, false, false, false, false, false]);
    // Monday to Friday: 5 days, 1 done; today unmarked.
    expect({ done: overview.done, counted: overview.counted }).toEqual({ done: 1, counted: 5 });
    expect(overview.hasEarlier).toBe(false);
  });

  it("should add up good days per week for weekly goals", () => {
    const gym = habit("gym", ["2026-09-29", "2026-10-01", "2026-10-06"].map((d) => day(d, HABIT_STATUS.GOOD)), {
      goal: { type: "weekly", times: 2 },
    });

    expect(buildOverview([gym], 2, 0, TODAY).rows[0].weekTotals).toEqual([2, 1]);
    const newer = { ...gym, streak: [day("2026-10-06", HABIT_STATUS.GOOD)], createdAt: new Date(2026, 9, 6, 8, 0) };
    expect(buildOverview([newer], 2, 0, TODAY).rows[0].weekTotals).toEqual([undefined, 1]);
    expect(buildOverview([habit("run", [])], 2, 0, TODAY).rows[0].weekTotals).toBeUndefined();
  });

  it("should only offer earlier periods when there is something there", () => {
    const old = habit("old", [day("2026-09-01", HABIT_STATUS.GOOD)]);
    const fresh = habit("fresh", [], { createdAt: new Date(2026, 9, 1) });

    expect(buildOverview([old], 2, 0, TODAY).hasEarlier).toBe(true);
    expect(buildOverview([fresh], 2, 0, TODAY).hasEarlier).toBe(false);
    expect(buildOverview([], 2, 0, TODAY).hasEarlier).toBe(false);
    // Going back, a habit that didn't exist yet is left out.
    expect(buildOverview([old, fresh], 2, 1, TODAY).rows.map((r) => r.habit.id)).toEqual(["old"]);
  });
});
