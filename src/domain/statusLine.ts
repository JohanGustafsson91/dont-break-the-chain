// The one-line status on a habit's card. It picks the most useful thing to say about
// this habit right now instead of a generic pep talk, built on a few ideas that help
// habits stick:
// - never miss twice: one miss is fine, two in a row is how habits fade;
// - a near goal motivates more than a big number (the next milestone, the record);
// - after a miss, the user's own comeback rate beats guilt.
// The same situation always gives the same line. Lines stay short (at most about 26
// characters) so they fit a 360 px phone card that also shows the ✓ and ✗ buttons.
import { HABIT_STATUS } from "../shared/constants";
import { createDate, getToday, isSameDay } from "../utils/date";
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

const DAY_MS = 24 * 60 * 60 * 1000;
const MILESTONES = [7, 14, 21, 30, 50, 100, 200, 365];
const days = (n: number) => `${n} ${pluralize(n, "day")}`;
const nextMilestone = (n: number) => MILESTONES.find((m) => m > n);

type Status = Habit["streak"][number]["status"];
const statusOn = (habit: Habit, date: Date): Status | undefined =>
  habit.streak.find((s) => isSameDay(createDate(s.date), date) && s.status !== HABIT_STATUS.NOT_SPECIFIED)?.status;

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

/** How often a ✗ was followed by a ✓ the next day, as a share 0..1, with the count. */
const comebackRate = (habit: Habit, today: Date) => {
  const byDay = new Map(habit.streak.map((s) => [createDate(s.date).getTime(), s.status]));
  const next = getBadDays(habit)
    .map((d) => createDate(d.date).getTime())
    .filter((t) => t < today.getTime())
    .map((t) => byDay.get(t + DAY_MS))
    .filter((s) => s === HABIT_STATUS.GOOD || s === HABIT_STATUS.BAD);
  return { samples: next.length, rate: next.filter((s) => s === HABIT_STATUS.GOOD).length / (next.length || 1) };
};

const weeklyLine = (habit: Habit, today: Date, markedToday: boolean, times: number) => {
  const left = times - countGoodDaysInWeek(habit, today);
  // Days left in the week, today included (weeks start on Monday).
  const daysLeft = 7 - ((today.getUTCDay() + 6) % 7);
  if (left <= 0) {
    const weeks = getStreakSummary(habit).current;
    if (weeks >= 2) return `Goal met ${weeks} weeks in a row`;
    return daysLeft > 1 ? `Done, ${days(daysLeft - 1)} to spare` : "This week's goal is done";
  }
  if (markedToday) return `Nice! ${left} more this week`;
  if (left > daysLeft) return "Tough week, keep going";
  if (left === daysLeft) return `${left} more, every day counts`;
  return `${left} more this week`;
};

export const habitStatusLine = (habit: Habit): string => {
  const today = getToday();
  const yesterday = new Date(today.getTime() - DAY_MS);
  const todayStatus = statusOn(habit, today);
  const missedYesterday = statusOn(habit, yesterday) === HABIT_STATUS.BAD;

  if (habit.goal.type === "weekly") {
    return weeklyLine(habit, today, todayStatus === HABIT_STATUS.GOOD, habit.goal.times);
  }

  const current = calculateCurrentStreak(habit).count;
  const best = bestBeforeCurrentChain(habit);

  if (todayStatus === HABIT_STATUS.GOOD) {
    const milestone = nextMilestone(current);
    if (best >= 2 && current > best) return `New best: ${days(current)}!`;
    if (MILESTONES.includes(current)) return `${current} days in a row!`;
    if (current >= 2 && best > current && best - current <= 3) return `Day ${current}, ${best - current} to your best`;
    if (current >= 2 && milestone && milestone - current <= 5) return `Day ${current}, ${milestone - current} more to ${milestone}`;
    if (missedYesterday) return "Back on track!";
    return current <= 1 ? "Day 1 of a new chain" : `Day ${current} in a row`;
  }

  if (todayStatus === HABIT_STATUS.BAD) {
    const comeback = comebackRate(habit, today);
    if (comeback.samples >= 5 && comeback.rate >= 0.95) return "You always bounce back";
    if (comeback.samples >= 5 && comeback.rate >= 0.6) return `You recover ${Math.round(comeback.rate * 10)} in 10 times`;
    const [good, bad] = [getGoodDays(habit).length, getBadDays(habit).length];
    const share = Math.round((good / (good + bad)) * 100);
    return share >= 70 ? `Still ${share} % good overall` : "Just don't miss twice";
  }

  // Not marked yet. `current` is the chain up to yesterday, still alive.
  if (current >= 2 && best >= 2 && current === best) return "Mark today for a new best";
  if (current >= 2 && best >= 2 && current > best) return "Today extends your record";
  if (current > 0 && MILESTONES.includes(current + 1)) return `Today makes it ${current + 1} days`;
  if (missedYesterday) return "Don't miss twice";
  const hardest = hardestWeekday(habit, today);
  if (hardest && hardest.weekday === today.getUTCDay()) return `${hardest.name} tend to slip`;
  const milestone = nextMilestone(current);
  if (current >= 3 && milestone && milestone - current <= 3) return `${days(milestone - current)} to a ${milestone}-day chain`;
  if (habit.createdAt) {
    const age = Math.floor((today.getTime() - createDate(habit.createdAt).getTime()) / DAY_MS);
    if (age >= 1 && age < 7) {
      const done = getGoodDays(habit).filter((d) => createDate(d.date).getTime() >= createDate(habit.createdAt!).getTime()).length;
      return `First week: ${done} of 7 done`;
    }
  }
  if (current > 0) return `Keep your ${current}-day chain`;
  if (getGoodDays(habit).length > 0) return "Pick it back up today";
  return "Start your first day";
};
