import { describe, it, expect } from "vitest";
import { buildYearOverview } from "./yearOverview";
import { HABIT_STATUS } from "../shared/constants";

// Saturday. Its week starts Monday 2025-02-10; 52 weeks before that, across the
// leap day 2024-02-29, is Monday 2024-02-12.
const TODAY = new Date("2025-02-15T00:00:00Z");

const day = (iso: string, status: "GOOD" | "BAD") => ({
  date: new Date(`${iso}T00:00:00Z`),
  status: HABIT_STATUS[status],
  notes: "",
});

describe("Year overview - a GitHub-style grid of the last 12 months", () => {
  it("should lay out 53 Monday-first weeks ending with today", () => {
    const { weeks } = buildYearOverview([], TODAY);

    expect(weeks).toHaveLength(53);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0][0]?.date.toISOString()).toBe("2024-02-12T00:00:00.000Z");

    const thisWeek = weeks[52];
    expect(thisWeek[5]?.date.toISOString()).toBe("2025-02-15T00:00:00.000Z");
    expect(thisWeek[6]).toBeUndefined(); // tomorrow
  });

  it("should show each day's status and count good days within the year only", () => {
    const { weeks, goodDays } = buildYearOverview(
      [
        day("2025-02-15", "GOOD"),
        day("2025-02-14", "BAD"),
        day("2025-02-10", "GOOD"),
        day("2024-01-01", "GOOD"), // before the grid
      ],
      TODAY,
    );

    const thisWeek = weeks[52];
    expect(thisWeek.map((cell) => cell?.status)).toEqual([
      "GOOD",
      "NOT_SPECIFIED",
      "NOT_SPECIFIED",
      "NOT_SPECIFIED",
      "BAD",
      "GOOD",
      undefined,
    ]);
    expect(goodDays).toBe(2);
  });

  it("should end the grid on Sunday and on Monday the same way", () => {
    const sunday = buildYearOverview([], new Date("2025-02-16T00:00:00Z")).weeks[52];
    const monday = buildYearOverview([], new Date("2025-02-17T00:00:00Z")).weeks[52];

    expect(sunday.every((cell) => cell !== undefined)).toBe(true);
    expect(monday[0]?.date.toISOString()).toBe("2025-02-17T00:00:00.000Z");
    expect(monday.slice(1).every((cell) => cell === undefined)).toBe(true);
  });

  it("should only label months that have started, once, across the new year", () => {
    // Thursday 2 Oct 2025: the current week holds 1 Oct, and so does the first
    // column (30 Sep – 6 Oct 2024). The label belongs to this year's column only.
    const { monthLabels } = buildYearOverview([], new Date("2025-10-02T00:00:00Z"));
    const labelled = monthLabels.filter((date) => date !== undefined);

    expect(monthLabels[0]).toBeUndefined();
    expect(labelled).toHaveLength(12);
    expect(labelled[0]?.toISOString()).toBe("2024-11-01T00:00:00.000Z");
    expect(labelled[11]?.toISOString()).toBe("2025-10-01T00:00:00.000Z");

    // Monday 29 Sep 2025: 1 Oct is in this week but hasn't happened yet.
    const beforeOctober = buildYearOverview([], new Date("2025-09-29T00:00:00Z"));
    expect(beforeOctober.monthLabels[52]).toBeUndefined();
  });

  it("should label the week each month starts in", () => {
    const { monthLabels } = buildYearOverview([], TODAY);
    const labelled = monthLabels.filter((date) => date !== undefined);

    // March 2024 to February 2025.
    expect(labelled).toHaveLength(12);
    expect(labelled[0]?.toISOString()).toBe("2024-03-01T00:00:00.000Z");
    expect(labelled[11]?.toISOString()).toBe("2025-02-01T00:00:00.000Z");
    expect(monthLabels[0]).toBeUndefined();
  });
});
