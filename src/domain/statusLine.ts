// The one-line status on a habit's card. It picks the most useful thing to say about
// this habit right now instead of a generic pep talk, built on a few ideas that help
// habits stick:
// - never miss twice: one miss is fine, two in a row is how habits fade;
// - a near goal motivates more than a big number (the next milestone, the record);
// - after a miss, the user's own comeback rate beats guilt.
// The same situation always gives the same line. At most one emoji, at the end, with
// one meaning each (🏆 record, 🎉 milestone, 🎯 near goal, 🔗 chain, 💪 comeback,
// 🌱 fresh start, ✅ weekly goal met); plain facts get none. Lines stay short so they
// fit a 360 px phone card that also shows the ✓ and ✗ buttons.
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
// Milestones never run out: these, then every full year (730, 1095, …).
const MILESTONES = [7, 14, 21, 30, 50, 100, 200, 365, 500, 1000];
const YEAR = 365;
const isMilestone = (n: number) => MILESTONES.includes(n) || (n > 0 && n % YEAR === 0);
const days = (n: number) => `${n} ${pluralize(n, "day")}`;
const nextMilestone = (n: number) =>
  Math.min(MILESTONES.find((m) => m > n) ?? Infinity, (Math.floor(n / YEAR) + 1) * YEAR);
const years = (n: number) => `${n / YEAR} ${pluralize(n / YEAR, "year")}`;

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
    if (weeks >= 2) return `Goal met ${weeks} weeks in a row 🏆`;
    return daysLeft > 1 ? `Done, ${days(daysLeft - 1)} to spare ✅` : "This week's goal is done ✅";
  }
  if (markedToday) return `Nice, ${left} more this week 💪`;
  // Out of reach this week, but every day still adds up.
  if (left > daysLeft) return "Every extra day counts";
  if (left === daysLeft) return `${left} more, every day counts 🎯`;
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
    if (isMilestone(current)) {
      return current % YEAR === 0 ? `${years(current)} in a row 🎉` : `${current} days in a row 🎉`;
    }
    // Only on the day the record falls; after that it's just a long chain.
    if (best >= 2 && current === best + 1) return `New best: ${days(current)} 🏆`;
    if (current >= 2 && best > current && best - current <= 3) return `Day ${current}, ${best - current} to your best 🎯`;
    if (current >= 2 && milestone && milestone - current <= 5) return `Day ${current}, ${milestone - current} to ${milestone} 🎯`;
    if (missedYesterday) return "Back on track 💪";
    return current <= 1 ? "Day 1 of a new chain 🌱" : `Day ${current} in a row 🔗`;
  }

  if (todayStatus === HABIT_STATUS.BAD) {
    const comeback = comebackRate(habit, today);
    if (comeback.samples >= 5 && comeback.rate >= 0.95) return "You always bounce back";
    if (comeback.samples >= 5 && comeback.rate >= 0.6) return `You recover ${Math.round(comeback.rate * 10)} in 10 times`;
    const [good, bad] = [getGoodDays(habit).length, getBadDays(habit).length];
    const share = Math.round((good / (good + bad)) * 100);
    // Reassure today; "Don't miss twice" comes tomorrow if it's still unmarked.
    return share >= 70 ? `Still ${share} % good overall` : "One miss is fine 🌱";
  }

  // Not marked yet. `current` is the chain up to yesterday, still alive.
  if (current > 0 && isMilestone(current + 1)) {
    return (current + 1) % YEAR === 0 ? `Today makes ${years(current + 1)} 🎯` : `Today is day ${current + 1} 🎯`;
  }
  if (current >= 2 && best >= 2 && current === best) return "Beat your best today 🏆";
  if (missedYesterday) return "Don't miss twice 💪";
  const hardest = hardestWeekday(habit, today);
  if (hardest && hardest.weekday === today.getUTCDay()) return `${hardest.name} tend to slip`;
  const milestone = nextMilestone(current);
  if (current >= 3 && milestone && milestone - current <= 3) return `${days(milestone - current)} to ${milestone} in a row 🎯`;
  if (current >= 2 && best >= 2 && current > best) return "On a record run 🏆";
  if (habit.createdAt) {
    const age = Math.floor((today.getTime() - createDate(habit.createdAt).getTime()) / DAY_MS);
    if (age >= 1 && age < 7) {
      const done = getGoodDays(habit).filter((d) => createDate(d.date).getTime() >= createDate(habit.createdAt!).getTime()).length;
      return `First week: ${done} of 7 done 🌱`;
    }
  }
  if (current > 0) return `${days(current)}, keep going 🔗`;
  // A plain fact rather than the same nudge every day; the user decides what's next.
  const lastDone = Math.max(...getGoodDays(habit).map((d) => createDate(d.date).getTime()));
  if (Number.isFinite(lastDone)) return `Last done ${days(Math.round((today.getTime() - lastDone) / DAY_MS))} ago`;
  return "Start your first day 🌱";
};
