import { describe, it, expect } from "vitest";
import { moveHabit, orderChanges, sortHabits, withOrders } from "./habitOrder";
import type { Habit } from "./Habit";

const habit = (id: string, extra: Partial<Habit> = {}): Habit => ({
  id,
  name: id,
  description: "",
  goal: { type: "daily" },
  streak: [],
  ...extra,
});
const ids = (habits: Habit[]) => habits.map((h) => h.id);

describe("habitOrder", () => {
  it("should sort by hand-set order first, then the rest by when they were created", () => {
    const habits = [
      habit("newest", { createdAt: new Date("2026-10-01") }),
      habit("second", { order: 1, createdAt: new Date("2026-01-01") }),
      habit("oldest", { createdAt: new Date("2025-01-01") }),
      habit("first", { order: 0, createdAt: new Date("2026-05-01") }),
    ];

    expect(ids(sortHabits(habits))).toEqual(["first", "second", "oldest", "newest"]);
  });

  it("should keep a stable order for habits without order or creation date", () => {
    expect(ids(sortHabits([habit("b"), habit("a")]))).toEqual(["a", "b"]);
  });

  it("should move a habit to another's place, shifting those in between", () => {
    const habits = [habit("a"), habit("b"), habit("c"), habit("d")];

    expect(ids(moveHabit(habits, "a", "c"))).toEqual(["b", "c", "a", "d"]);
    expect(ids(moveHabit(habits, "d", "b"))).toEqual(["a", "d", "b", "c"]);
    expect(moveHabit(habits, "a", "a")).toBe(habits);
    expect(moveHabit(habits, "a", "missing")).toBe(habits);
  });

  it("should only save the habits whose place changed", () => {
    const habits = [habit("b", { order: 1 }), habit("a", { order: 0 }), habit("c", { order: 2 }), habit("new")];

    expect(orderChanges(habits)).toEqual([
      { id: "b", order: 0 },
      { id: "a", order: 1 },
      { id: "new", order: 3 },
    ]);
  });

  it("should change only the order, keeping days marked meanwhile, and restore the old order", () => {
    const before = [habit("a", { createdAt: new Date("2025-01-01") }), habit("b", { createdAt: new Date("2025-02-01") })];
    const sorted = withOrders(before, new Map([["b", 0], ["a", 1]]));
    expect(ids(sorted)).toEqual(["b", "a"]);

    // A day is marked on "a" while the save is in flight, then the save fails.
    const marked = sorted.map((h) =>
      h.id === "a" ? { ...h, streak: [{ date: new Date("2025-03-01"), status: "GOOD" as const, notes: "" }] } : h,
    );
    const rolledBack = withOrders(marked, new Map(before.map((h) => [h.id, h.order])));

    expect(ids(rolledBack)).toEqual(["a", "b"]);
    expect(rolledBack[0].streak).toHaveLength(1);
    expect(rolledBack[0].order).toBeUndefined();
  });
});
