export interface Habit {
  id: string;
  name: string;
  description: string;
  streak: DayInStreak[];
}

export type HabitStatus = "GOOD" | "BAD";

export interface DayInStreak {
  date: Date;
  status: HabitStatus;
  notes: string;
}
