import "./GoalSelect.css";
import type { Goal } from "../../domain/Habit";
import { useMessages } from "../../i18n/i18n";
import { goalSelectMessages } from "./messages";

const WEEKLY_OPTIONS = [1, 2, 3, 4, 5, 6];

export const GoalSelect = ({ goal, onChange }: Props) => {
  const m = useMessages(goalSelectMessages);

  return (
    <label className="GoalSelect">
      <span>{m.goal}</span>
      <select
        value={goal.type === "weekly" ? String(goal.times) : "daily"}
        onChange={(e) =>
          onChange(
            e.target.value === "daily"
              ? { type: "daily" }
              : { type: "weekly", times: Number(e.target.value) },
          )
        }
      >
        <option value="daily">{m.everyDay}</option>
        {WEEKLY_OPTIONS.map((times) => (
          <option key={times} value={times}>
            {m.timesAWeek(times)}
          </option>
        ))}
      </select>
    </label>
  );
};

interface Props {
  goal: Goal;
  onChange: (goal: Goal) => void;
}
