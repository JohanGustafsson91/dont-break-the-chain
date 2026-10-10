// The one-line status on a habit's card. It picks the most useful thing to say about
// this habit right now (a record within reach, a milestone, the weekday that tends to
// slip, what's left of a weekly goal) instead of a generic pep talk. The same situation
// always gives the same line. Lines stay short (at most about 26 characters) so they fit
// a 360 px phone card that also shows the ✓ and ✗ buttons.
import { HABIT_STATUS } from "../shared/constants";
import { createDate, getToday, isSameDay, isYesterday } from "../utils/date";
import { pluralize } from "../utils/string";
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  countGoodDaysInWeek,
  getBadDays,
  getGoodDays,
  getStreakSummary,
  type Habit,
} from "./Habit";
import { hardestWeekday } from "./insights";

const MILESTONES = [7, 14, 21, 30, 50, 100, 200, 365];
const days = (n: number) => `${n} ${pluralize(n, "day")}`;

/** The longest chain before the current one (0 if there was none). */
const bestBeforeCurrentChain = (habit: Habit) => {
  const { from, to } = calculateCurrentStreak(habit);
  if (!from || !to) return calculateLongestStreak(habit).count;
  const [start, end] = [createDate(from).getTime(), createDate(to).getTime()];
  const earlier = habit.streak.filter((s) => {
    const t = createDate(s.date).getTime();
    return t < start || t > end;
  });
  return calculateLongestStreak({ ...habit, streak: earlier }).count;
};

const weeklyLine = (habit: Habit, today: Date, markedToday: boolean, times: number) => {
  const left = times - countGoodDaysInWeek(habit, today);
  if (left <= 0) {
    const weeks = getStreakSummary(habit).current;
    return weeks >= 2 ? `Goal met ${weeks} weeks in a row` : "This week's goal is done";
  }
  if (markedToday) return `Nice! ${left} more this week`;
  // Days left in the week, today included (weeks start on Monday).
  const daysLeft = 7 - ((today.getUTCDay() + 6) % 7);
  if (left > daysLeft) return "Tough week, keep going";
  if (left === daysLeft) return `${left} more, every day counts`;
  return `${left} more this week`;
};

export const habitStatusLine = (habit: Habit): string => {
  const today = getToday();
  const entryToday = habit.streak.find(
    (s) => isSameDay(createDate(s.date), today) && s.status !== HABIT_STATUS.NOT_SPECIFIED,
  );

  if (habit.goal.type === "weekly") {
    return weeklyLine(habit, today, entryToday?.status === HABIT_STATUS.GOOD, habit.goal.times);
  }

  const current = calculateCurrentStreak(habit).count;
  const best = bestBeforeCurrentChain(habit);

  if (entryToday?.status === HABIT_STATUS.GOOD) {
    if (best >= 2 && current > best) return `New best: ${days(current)}!`;
    if (MILESTONES.includes(current)) return `${current} days in a row!`;
    if (current >= 2 && best - current > 0 && best - current <= 3) {
      return `Day ${current}, ${best - current} to your best`;
    }
    return current <= 1 ? "Day 1 of a new chain" : `Day ${current} in a row`;
  }

  if (entryToday?.status === HABIT_STATUS.BAD) {
    const [good, bad] = [getGoodDays(habit).length, getBadDays(habit).length];
    const share = Math.round((good / (good + bad)) * 100);
    // Perspective rather than guilt, when the overall record is good.
    return share >= 70 ? `Still ${share} % good overall` : "Tomorrow is a new day";
  }

  // Not marked yet. `current` is the chain up to yesterday, still alive.
  if (current >= 2 && best >= 2 && current === best) return "Mark today for a new best";
  if (current >= 2 && best >= 2 && current > best) return "Today extends your record";
  if (MILESTONES.includes(current + 1) && current > 0) return `Today makes it ${current + 1} days`;
  const hardest = hardestWeekday(habit, today);
  if (hardest && hardest.weekday === today.getUTCDay()) return `${hardest.name} tend to slip`;
  if (current > 0) return `Keep your ${current}-day chain`;
  if (habit.streak.some((s) => isYesterday(createDate(s.date)) && s.status === HABIT_STATUS.BAD)) {
    return "A fresh start today";
  }
  return habit.streak.length === 0 ? "Start your first day" : "Not marked today";
};
