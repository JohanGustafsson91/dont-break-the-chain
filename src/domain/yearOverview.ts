// Builds a GitHub-style year grid: one column per week (Monday first), ending this week.

import { HABIT_STATUS } from "../shared/constants";
import { createDate, getToday } from "../utils/date";
import { startOfWeek, type StreakDay } from "./Habit";

const WEEKS = 53;
const DAYS_PER_WEEK = 7;

export interface YearCell {
  date: Date;
  status: StreakDay["status"];
}

export interface YearOverview {
  /** Columns of 7 days, Monday to Sunday. Days after today are undefined. */
  weeks: Array<Array<YearCell | undefined>>;
  /** The month starting in each column, or undefined. */
  monthLabels: Array<Date | undefined>;
  goodDays: number;
}

export const buildYearOverview = (
  streak: StreakDay[],
  today: Date = getToday(),
): YearOverview => {
  const statusByDay = new Map(
    streak.map((d) => [createDate(d.date).getTime(), d.status]),
  );
  const thisMonday = startOfWeek(today);

  const dayAt = (week: number, weekday: number) =>
    createDate({
      year: thisMonday.getUTCFullYear(),
      month: thisMonday.getUTCMonth(),
      day: thisMonday.getUTCDate() - (WEEKS - 1 - week) * DAYS_PER_WEEK + weekday,
    });

  const weeks = Array.from({ length: WEEKS }, (_, week) =>
    Array.from({ length: DAYS_PER_WEEK }, (_, weekday) => {
      const date = dayAt(week, weekday);
      return date.getTime() > today.getTime()
        ? undefined
        : {
            date,
            status: statusByDay.get(date.getTime()) ?? HABIT_STATUS.NOT_SPECIFIED,
          };
    }),
  );

  const monthStarts = weeks.map(
    (week) => week.find((cell) => cell?.date.getUTCDate() === 1)?.date,
  );
  const startedMonths = monthStarts.filter((date) => date !== undefined);
  const lastMonth = startedMonths[startedMonths.length - 1];

  // 53 weeks span a bit more than a year, so the first column can repeat this month.
  const monthLabels = monthStarts.map((date, week) =>
    week === 0 && date?.getUTCMonth() === lastMonth?.getUTCMonth()
      ? undefined
      : date,
  );

  const goodDays = weeks
    .flat()
    .filter((cell) => cell?.status === HABIT_STATUS.GOOD).length;

  return { weeks, monthLabels, goodDays };
};
