import { createDate } from "../../utils/date";

const today = new Date();

// Create a 5-day GOOD streak starting from today
const goodStreak = Array.from({ length: 5 }, (_, i) => ({
  date: createDate({
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate() - i,
  }),
  status: "GOOD" as const,
  notes: "",
}));

// Create 2 BAD days after the GOOD streak
const badDays = Array.from({ length: 2 }, (_, i) => ({
  date: createDate({
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate() - 5 - i,
  }),
  status: "BAD" as const,
  notes: "",
}));

// Create a 4-day GOOD streak before the BAD days
const previousGoodStreak = Array.from({ length: 9 }, (_, i) => ({
  date: createDate({
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate() - 7 - i,
  }),
  status: "GOOD" as const,
  notes: "",
}));

export const mockData = [...goodStreak, ...badDays, ...previousGoodStreak];
