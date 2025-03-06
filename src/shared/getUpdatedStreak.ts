import { isSameDay } from "../utils/date";
import { DayInStreak, Habit } from "./Habit";
import { Status } from "./Status";

export const getUpdatedStreak = ({
  habit,
  date,
  status,
  notes = "",
}: GetUpdatedStreak) => {
  const actionMap = {
    remove: (streak: Habit["streak"]) =>
      streak.filter((s) => !isSameDay(s.date, date)),
    add: (streak: Habit["streak"]) => [...streak, { date, status, notes: "" }],
    update: (streak: Habit["streak"]) =>
      streak.map((s) =>
        isSameDay(s.date, date) ? { ...s, status, notes } : s,
      ),
  };

  const doAction =
    status === "NOT_SPECIFIED"
      ? "remove"
      : habit.streak.find((s) => isSameDay(s.date, date))
        ? "update"
        : "add";

  const streak = actionMap[doAction](habit.streak) as DayInStreak[];
  const previousStreak = habit.streak;

  return {
    streak,
    previousStreak,
  };
};

export interface GetUpdatedStreak {
  habit: Habit;
  date: DayInStreak["date"];
  status: Status;
  notes?: DayInStreak["notes"];
}
