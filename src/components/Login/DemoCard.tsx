import { useState } from "react";
import { markDay, type Habit } from "../../domain/Habit";
import { habitStatusLine } from "../../domain/statusLine";
import { useMessages } from "../../i18n/i18n";
import { HABIT_STATUS } from "../../shared/constants";
import { createDate, formatDay, getToday } from "../../utils/date";
import { loginMessages } from "./messages";

const daysAgo = (n: number) => {
  const today = getToday();
  return createDate({ year: today.getUTCFullYear(), month: today.getUTCMonth(), day: today.getUTCDate() - n });
};

// Six days done, today still open: one tap away from a milestone.
const demoHabit = (name: string): Habit => ({
  id: "demo",
  name,
  description: "",
  goal: { type: "daily" },
  streak: [6, 5, 4, 3, 2, 1].map((n) => ({ date: daysAgo(n), status: HABIT_STATUS.GOOD, notes: "" })),
  createdAt: daysAgo(6),
});

/**
 * A habit card to try without an account. The status line is the app's real one, so
 * checking today turns "Today is day 7" into a milestone, in the visitor's language.
 */
export const DemoCard = () => {
  const t = useMessages(loginMessages);
  const [done, setDone] = useState(false);
  const habit = demoHabit(t.demoHabit);
  const shown = done ? markDay(habit, getToday(), HABIT_STATUS.GOOD) : habit;
  const week = [6, 5, 4, 3, 2, 1, 0].map(daysAgo);
  const isDone = (date: Date) => shown.streak.some((s) => s.date.getTime() === date.getTime());

  return (
    <div className={`Login-demo${done ? " Login-demo_done" : ""}`}>
      <div className="Login-demo_text">
        <span className="Login-demo_name">{habit.name}</span>
        {/* Announced, so a screen reader hears the milestone too. */}
        <span className="Login-demo_status" aria-live="polite">
          {habitStatusLine(shown)}
        </span>
      </div>
      <button
        type="button"
        className="Login-demo_check"
        aria-pressed={done}
        aria-label={t.demoCheck}
        onClick={() => setDone((d) => !d)}
      >
        ✓
      </button>
      <div className="Login-demo_week" aria-hidden="true">
        {week.map((date, i) => (
          <span
            key={date.getTime()}
            className={`Login-demo_cell${isDone(date) ? " Login-demo_cell-done" : ""}`}
            style={{ animationDelay: `${i * 45}ms` }}
            title={formatDay(date, { weekday: "short" })}
          />
        ))}
        {/* After the tap, point at signing in: this was an example, your own chain starts there. */}
        <span className="Login-demo_hint">{done ? t.demoNext : t.demoHint}</span>
      </div>
    </div>
  );
};
