export interface Activity {
  name: string;
  description: string;
  streak: DayInStreak[];
}

export interface DayInStreak {
  date: Date;
  status: "GOOD" | "BAD";
  notes: string;
}
