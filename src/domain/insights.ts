// Pure functions that turn a habit's history into short, actionable sentences.

import { HABIT_STATUS } from "../shared/constants";
import { createDate } from "../utils/date";
import type { Habit } from "./Habit";

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const MIN_HISTORY_IN_DAYS = 28;
const MAX_INSIGHTS = 2;

const WEEKDAYS = [
  "Sundays",
  "Mondays",
  "Tuesdays",
  "Wednesdays",
  "Thursdays",
  "Fridays",
  "Saturdays",
];

type Status = Habit["streak"][number]["status"];

// Dates are UTC midnights, so whole days since the epoch make day arithmetic trivial.
const toDayNumber = (date: Date) =>
  Math.round(createDate(date).getTime() / ONE_DAY_IN_MS);

const percent = (part: number, total: number) =>
  Math.round((part / total) * 100);

const statusByDay = (habit: Habit) =>
  new Map<number, Status>(
    habit.streak.map((d) => [toDayNumber(d.date), d.status]),
  );

const goodShare = (statuses: Status[]) => {
  const marked = statuses.filter((s) => s !== HABIT_STATUS.NOT_SPECIFIED);
  const good = marked.filter((s) => s === HABIT_STATUS.GOOD).length;
  return { marked: marked.length, good };
};

const daysInRange = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** "You miss most often on Sundays: 4 of the last 6." */
const weekdayInsight = (habit: Habit, today: number) => {
  const days = statusByDay(habit);
  const LOOKBACK = 6;
  const MIN_MISSES = 3;
  // Must clearly beat every other weekday, or it's just noise (or misses everywhere).
  const MIN_LEAD = 2;

  const misses = WEEKDAYS.map((name, weekday) => {
    // Day 0 (1970-01-01) was a Thursday, hence the +4.
    const lastOccurrence = today - ((today + 4 - weekday + 7) % 7);
    const occurrences = Array.from(
      { length: LOOKBACK },
      (_, i) => lastOccurrence - i * 7,
    );
    const count = occurrences.filter(
      (day) => days.get(day) === HABIT_STATUS.BAD,
    ).length;
    return { name, count };
  });

  const [worst, runnerUp] = [...misses].sort((a, b) => b.count - a.count);

  return worst.count >= MIN_MISSES && worst.count - runnerUp.count >= MIN_LEAD
    ? `You miss most often on ${worst.name}: ${worst.count} of the last ${LOOKBACK}.`
    : undefined;
};

/** "After a bad day, the next day is good 85 % of the time." */
export const recoveryInsight = (habit: Habit) => {
  const days = statusByDay(habit);
  const MIN_SAMPLES = 8;
  // Meant to counter "it's all ruined" after a miss, so only shown when encouraging.
  const MIN_RECOVERY = 50;

  const nextDays = [...days]
    .filter(([, status]) => status === HABIT_STATUS.BAD)
    .map(([day]) => days.get(day + 1))
    .filter((status) => status !== undefined);

  if (nextDays.length < MIN_SAMPLES) return undefined;

  const good = nextDays.filter((s) => s === HABIT_STATUS.GOOD).length;
  const recovery = percent(good, nextDays.length);

  return recovery >= MIN_RECOVERY
    ? `After a bad day, the next day is good ${recovery} % of the time.`
    : undefined;
};

/** "Your chains usually break after 4–5 days." */
const chainBreakInsight = (habit: Habit, today: number) => {
  const MIN_BROKEN_CHAINS = 4;
  const days = statusByDay(habit);

  const goodDays = habit.streak
    .filter((d) => d.status === HABIT_STATUS.GOOD)
    .map((d) => toDayNumber(d.date))
    .sort((a, b) => a - b);

  // Like the calendar's chain links, any day that isn't ✓ ends a chain.
  const chains = goodDays.reduce<{ end: number; length: number }[]>(
    (acc, day) => {
      const last = acc[acc.length - 1];
      if (last && day === last.end + 1) {
        last.end = day;
        last.length += 1;
      } else {
        acc.push({ end: day, length: 1 });
      }
      return acc;
    },
    [],
  );

  // A chain ending yesterday is still alive, unless today is already a miss.
  const isOngoing = (end: number) =>
    end === today ||
    (end === today - 1 && days.get(today) !== HABIT_STATUS.BAD);

  const broken = chains
    .filter((chain) => !isOngoing(chain.end))
    .map((chain) => chain.length)
    .sort((a, b) => a - b);

  if (broken.length < MIN_BROKEN_CHAINS) return undefined;

  const quartile = (q: number) => broken[Math.floor((broken.length - 1) * q)];
  const [low, high] = [quartile(0.25), quartile(0.75)];
  const range = low === high ? `${low}` : `${low}–${high}`;

  return `Your chains usually break after ${range} ${high === 1 ? "day" : "days"}.`;
};

/** "78 % good days in the last 30 days, up from 61 %." */
const trendInsight = (habit: Habit, today: number) => {
  const days = statusByDay(habit);
  const WINDOW = 30;
  const MIN_MARKED = 10;
  const MIN_CHANGE = 10;
  const MIN_GOOD_DAYS_WEEKLY = 5;
  const MIN_CHANGE_WEEKLY = 3;

  const window = (end: number) =>
    daysInRange(end - WINDOW + 1, end).map(
      (day) => days.get(day) ?? HABIT_STATUS.NOT_SPECIFIED,
    );
  const [recent, previous] = [window(today), window(today - WINDOW)];

  if (habit.goal.type === "weekly") {
    const [now, before] = [recent, previous].map(
      (statuses) => goodShare(statuses).good,
    );
    return before >= MIN_GOOD_DAYS_WEEKLY &&
      Math.abs(now - before) >= MIN_CHANGE_WEEKLY
      ? `${now} good days in the last ${WINDOW} days, ${now > before ? "up" : "down"} from ${before}.`
      : undefined;
  }

  const [now, before] = [goodShare(recent), goodShare(previous)];
  if (now.marked < MIN_MARKED || before.marked < MIN_MARKED) return undefined;

  const [nowPct, beforePct] = [
    percent(now.good, now.marked),
    percent(before.good, before.marked),
  ];
  return Math.abs(nowPct - beforePct) >= MIN_CHANGE
    ? `${nowPct} % good days in the last ${WINDOW} days, ${nowPct > beforePct ? "up" : "down"} from ${beforePct} %.`
    : undefined;
};

export const getInsights = (habit: Habit, now: Date = new Date()): string[] => {
  if (habit.streak.length === 0) return [];

  const today = toDayNumber(now);
  const firstDay = Math.min(...habit.streak.map((d) => toDayNumber(d.date)));
  if (today - firstDay < MIN_HISTORY_IN_DAYS) return [];

  // Weekday, recovery and chain-break insights are about daily misses.
  const candidates =
    habit.goal.type === "weekly"
      ? [trendInsight(habit, today)]
      : [
          weekdayInsight(habit, today),
          trendInsight(habit, today),
          chainBreakInsight(habit, today),
          // Lowest priority: only fills a free slot.
          recoveryInsight(habit),
        ];

  return candidates
    .filter((insight) => insight !== undefined)
    .slice(0, MAX_INSIGHTS);
};
