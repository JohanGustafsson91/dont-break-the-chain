import { HABIT_STATUS } from "./constants";

export interface Habit {
  id: string;
  name: string;
  description: string;
  streak: DayInStreak[];
}

type HabitStatus = (typeof HABIT_STATUS)[keyof typeof HABIT_STATUS];

export interface DayInStreak {
  date: Date;
  status: HabitStatus;
  notes: string;
}
