// The overview: every habit side by side, one cell per day, over whole weeks
// (Monday first), so weekly goals always add up per column of seven.

import { HABIT_STATUS } from "../shared/constants";
import { createDate, getToday } from "../utils/date";
import { startOfWeek, type Habit, type StreakDay } from "./Habit";

export type OverviewWeeks = 2 | 4;

export interface OverviewCell {
  date: Date;
  status: StreakDay["status"];
  isToday: boolean;
  isFuture: boolean;
  /** Before the habit was created: nothing to show, and it doesn't count. */
  isBeforeStart: boolean;
}

export interface OverviewRow {
  habit: Habit;
  /** One array of seven cells per week. */
  weeks: OverviewCell[][];
  /** Good days per week, for weekly goals only; undefined for weeks before the habit began. */
  weekTotals?: Array<number | undefined>;
}

export interface Overview {
  /** The days of each week, Monday to Sunday. */
  weeks: Date[][];
  rows: OverviewRow[];
  /** Daily habits only: days done, and days that count (up to yesterday, plus today once marked). */
  done: number;
  counted: number;
  hasEarlier: boolean;
}

const addDays = (date: Date, days: number) =>
  createDate({ year: date.getUTCFullYear(), month: date.getUTCMonth(), day: date.getUTCDate() + days });

/**
 * `periodsBack` 0 is the period ending this week, 1 the one before it, and so on.
 */
export const buildOverview = (
  habits: Habit[],
  weekCount: OverviewWeeks,
  periodsBack: number,
  today: Date = getToday(),
): Overview => {
  const firstMonday = addDays(startOfWeek(today), -7 * (weekCount * (periodsBack + 1) - 1));
  const weeks = Array.from({ length: weekCount }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(firstMonday, w * 7 + d)),
  );

  // The day it was created (the user's local date of that moment), or an earlier day
  // marked afterwards in the calendar. Without either, every day is shown.
  const startOf = (habit: Habit) => {
    const start = Math.min(
      habit.createdAt ? getToday(habit.createdAt).getTime() : Infinity,
      ...habit.streak.map((s) => createDate(s.date).getTime()),
    );
    return Number.isFinite(start) ? start : -Infinity;
  };

  const rows = habits.map((habit): OverviewRow => {
    const statusByDay = new Map(habit.streak.map((s) => [createDate(s.date).getTime(), s.status]));
    const cells = weeks.map((days) =>
      days.map((date) => ({
        date,
        status: statusByDay.get(date.getTime()) ?? HABIT_STATUS.NOT_SPECIFIED,
        isToday: date.getTime() === today.getTime(),
        isFuture: date.getTime() > today.getTime(),
        isBeforeStart: date.getTime() < startOf(habit),
      })),
    );
    return habit.goal.type === "weekly"
      ? {
          habit,
          weeks: cells,
          weekTotals: cells.map((week) =>
            week.every((c) => c.isBeforeStart) ? undefined : week.filter((c) => c.status === HABIT_STATUS.GOOD).length,
          ),
        }
      : { habit, weeks: cells };
  });
  // A habit created after this period has nothing to show in it.
  const rowsInPeriod = rows.filter((row) => row.weeks.flat().some((c) => !c.isBeforeStart));

  const countedCells = rowsInPeriod
    .filter((row) => row.habit.goal.type === "daily")
    .flatMap((row) => row.weeks.flat())
    .filter(
      // Rest days are neither done nor missed, so they don't count either way.
      (c) =>
        !c.isFuture &&
        !c.isBeforeStart &&
        c.status !== HABIT_STATUS.REST &&
        !(c.isToday && c.status === HABIT_STATUS.NOT_SPECIFIED),
    );

  const earliest = Math.min(...habits.map(startOf).filter(Number.isFinite));

  return {
    weeks,
    rows: rowsInPeriod,
    done: countedCells.filter((c) => c.status === HABIT_STATUS.GOOD).length,
    counted: countedCells.length,
    hasEarlier: earliest < firstMonday.getTime(),
  };
};
