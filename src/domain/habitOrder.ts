import type { Habit } from "./Habit";

// Habits sorted by hand carry `order` (0, 1, 2, …). The rest fall back to when they
// were created, which is always a far larger number, so a new habit lands last.
const sortKey = (habit: Habit) => habit.order ?? habit.createdAt?.getTime() ?? 0;

export const sortHabits = (habits: Habit[]): Habit[] =>
  [...habits].sort((a, b) => sortKey(a) - sortKey(b) || a.id.localeCompare(b.id));

/** Keeps the order, with the given habits moved last. */
export const withLast = (habits: Habit[], last: Set<string>): Habit[] => [
  ...habits.filter((h) => !last.has(h.id)),
  ...habits.filter((h) => last.has(h.id)),
];

/** The `order` to save for each habit whose place differs from what is stored. */
export const orderChanges = (habits: Habit[]): { id: string; order: number }[] =>
  habits.flatMap((habit, order) => (habit.order === order ? [] : [{ id: habit.id, order }]));

/** Moves one habit to where another one is, shifting those in between. */
export const moveHabit = (habits: Habit[], fromId: string, toId: string): Habit[] => {
  const from = habits.findIndex((h) => h.id === fromId);
  const to = habits.findIndex((h) => h.id === toId);
  if (from < 0 || to < 0 || from === to) return habits;
  const rest = habits.filter((_, i) => i !== from);
  return [...rest.slice(0, to), habits[from], ...rest.slice(to)];
};

/**
 * Sets the given habits' `order` and sorts. Every other field is left as it is, so a
 * day marked while the order was saving survives both the save and a rollback.
 */
export const withOrders = (habits: Habit[], orders: Map<string, number | undefined>): Habit[] =>
  sortHabits(habits.map((h) => (orders.has(h.id) ? { ...h, order: orders.get(h.id) } : h)));
