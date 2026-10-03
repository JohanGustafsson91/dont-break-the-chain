import "./GoalSelect.css";
import type { Goal } from "../../domain/Habit";
import { pluralize } from "../../utils/string";

const WEEKLY_OPTIONS = [1, 2, 3, 4, 5, 6];

export const GoalSelect = ({ goal, onChange }: Props) => (
  <label className="GoalSelect">
    <span>Goal</span>
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
      <option value="daily">Every day</option>
      {WEEKLY_OPTIONS.map((times) => (
        <option key={times} value={times}>
          {times} {pluralize(times, "time")} a week
        </option>
      ))}
    </select>
  </label>
);

interface Props {
  goal: Goal;
  onChange: (goal: Goal) => void;
}
