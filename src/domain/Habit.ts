// Simple domain logic for habits - no fancy DDD, just pure functions

import { HABIT_STATUS } from "../shared/constants";
import { createDate, isNextDay, isYesterday } from "../utils/date";

export interface Habit {
  id: string;
  name: string;
  description: string;
  streak: StreakDay[];
}

export interface StreakDay {
  date: Date;
  status: (typeof HABIT_STATUS)[keyof typeof HABIT_STATUS];
  notes: string;
}

export const markDay = (
  habit: Habit,
  date: Date,
  status: StreakDay["status"],
  notes = "",
): Habit => {
  const existingIndex = habit.streak.findIndex((s) => {
    const sDate = createDate(s.date);
    const targetDate = createDate(date);
    return sDate.getTime() === targetDate.getTime();
  });

  if (status === HABIT_STATUS.NOT_SPECIFIED) {
    return {
      ...habit,
      streak: habit.streak.filter((s) => {
        const sDate = createDate(s.date);
        const targetDate = createDate(date);
        return sDate.getTime() !== targetDate.getTime();
      }),
    };
  }

  if (existingIndex >= 0) {
    const newStreak = [...habit.streak];
    newStreak[existingIndex] = { date, status, notes };
    return { ...habit, streak: newStreak };
  }

  return {
    ...habit,
    streak: [...habit.streak, { date, status, notes }],
  };
};

function buildStreaks(habit: Habit): Date[][] {
  const goodDays = habit.streak
    .filter((d) => d.status === HABIT_STATUS.GOOD)
    .map((d) => d.date)
    .sort((a, b) => a.getTime() - b.getTime());

  if (goodDays.length === 0) return [];

  return goodDays.reduce((acc, curr) => {
    if (acc.length === 0) return [[curr]];

    const lastStreak = acc[acc.length - 1];
    const lastDate = lastStreak[lastStreak.length - 1];

    if (isNextDay(lastDate, curr)) {
      lastStreak.push(curr);
      return acc;
    }

    return [...acc, [curr]];
  }, [] as Date[][]);
}

export const calculateCurrentStreak = (
  habit: Habit,
): { from: Date | undefined; to: Date | undefined; count: number } => {
  const streaks = buildStreaks(habit);

  if (streaks.length === 0) {
    return { from: undefined, to: undefined, count: 0 };
  }

  const lastStreak = streaks[streaks.length - 1];
  const lastDate = lastStreak[lastStreak.length - 1];
  const today = createDate(new Date());

  const isActive =
    createDate(lastDate).getTime() === today.getTime() || isYesterday(lastDate);

  const badDays = habit.streak
    .filter((d) => d.status === HABIT_STATUS.BAD)
    .map((d) => d.date);
  const todayIsBad = badDays.some(
    (d) => createDate(d).getTime() === today.getTime(),
  );

  if (!isActive || todayIsBad) {
    return { from: undefined, to: undefined, count: 0 };
  }

  return {
    from: lastStreak[0],
    to: lastDate,
    count: lastStreak.length,
  };
};

export const calculateLongestStreak = (
  habit: Habit,
): { from: Date | undefined; to: Date | undefined; count: number } => {
  const streaks = buildStreaks(habit);

  if (streaks.length === 0) {
    return { from: undefined, to: undefined, count: 0 };
  }

  const longest = streaks.reduce(
    (acc, curr) => (curr.length > acc.length ? curr : acc),
    [],
  );

  return {
    from: longest[0],
    to: longest[longest.length - 1],
    count: longest.length,
  };
};

export const getGoodDays = (habit: Habit): StreakDay[] =>
  habit.streak.filter((d) => d.status === HABIT_STATUS.GOOD);

export const getBadDays = (habit: Habit): StreakDay[] =>
  habit.streak.filter((d) => d.status === HABIT_STATUS.BAD);
