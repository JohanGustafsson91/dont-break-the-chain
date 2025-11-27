import { DayInStreak } from "./Habit";
import { HABIT_STATUS } from "./constants";

export const getGoodDays = (streak: DayInStreak[]) =>
  streak.filter((s) => s.status === HABIT_STATUS.GOOD);

export const getBadDays = (streak: DayInStreak[]) =>
  streak.filter((s) => s.status === HABIT_STATUS.BAD);
