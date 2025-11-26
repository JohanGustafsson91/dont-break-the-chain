import { createDate, isNextDay, isSameDay, isYesterday } from "../utils/date";
import { DayInStreak } from "./Habit";
import { HABIT_STATUS } from "./constants";

export function findStreaks(dates: DayInStreak[]): {
  longestStreak: { from: Date; to: Date; streak: number };
  currentStreak: { from: Date; to: Date; streak: number };
} {
  if (dates.length === 0)
    return {
      longestStreak: { from: new Date(), to: new Date(), streak: 0 },
      currentStreak: { from: new Date(), to: new Date(), streak: 0 },
    };

  const goodDates = dates
    .filter((day) => day.status === HABIT_STATUS.GOOD)
    .map((day) => createDate(day.date));

  if (goodDates.length === 0)
    return {
      longestStreak: { from: new Date(), to: new Date(), streak: 0 },
      currentStreak: { from: new Date(), to: new Date(), streak: 0 },
    };

  const goodDaysSorted = goodDates.sort((a, b) => a.getTime() - b.getTime());

  const streaks = goodDaysSorted.reduce(
    (acc, curr) => {
      if (acc.length === 0) {
        return [[curr]];
      }

      const [latestStreak] = [...acc].reverse();
      const [latestDateInStreak] = [...latestStreak].reverse();

      if (isNextDay(latestDateInStreak, curr)) {
        const updatedLatestStreak = [...latestStreak, curr];
        acc.pop();
        return [...acc, updatedLatestStreak];
      }

      return [...acc, [curr]];
    },
    [] as Array<Array<Date>>,
  );

  const longestStreak = streaks.reduce(
    (acc, curr) => (curr.length > acc.length ? curr : acc),
    [],
  );

  const today = createDate(new Date());
  const [lastStreak] = [...streaks].reverse();
  const [lastDateInLastStreak] = [...lastStreak].reverse();
  const currentStreakIsActive =
    isSameDay(lastDateInLastStreak, today) || isYesterday(lastDateInLastStreak);

  const badDatesSorted = dates
    .filter((day) => day.status === HABIT_STATUS.BAD)
    .map((day) => createDate(day.date))
    .sort((a, b) => a.getTime() - b.getTime());

  const [lastBadDay] = [...badDatesSorted].reverse();

  const currentStreak =
    currentStreakIsActive && (lastBadDay ? !isSameDay(lastBadDay, today) : true)
      ? lastStreak
      : [];

  return {
    longestStreak: {
      from: longestStreak[0],
      to: longestStreak[longestStreak.length - 1],
      streak: longestStreak.length,
    },
    currentStreak: {
      from: currentStreak[0],
      to: currentStreak[currentStreak.length - 1],
      streak: currentStreak.length,
    },
  };
}
