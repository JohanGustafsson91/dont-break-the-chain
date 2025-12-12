import type { DayInStreak } from "../../shared/Habit";
import { HABIT_STATUS } from "../../shared/constants";

type Status = DayInStreak["status"];

interface Props {
  currentStreakDay: Omit<DayInStreak, "status"> & { status: Status };
  onUpdateStatus: (arg: { status: Status; date: Date; notes: string }) => void;
}

export const StreakStatusRadioGroup = ({
  currentStreakDay,
  onUpdateStatus,
}: Props) => {
  return [HABIT_STATUS.GOOD, HABIT_STATUS.BAD, HABIT_STATUS.NOT_SPECIFIED].map((status) => {
    const checked = Boolean(
      (currentStreakDay?.status ?? HABIT_STATUS.NOT_SPECIFIED) === status,
    );

    return (
      <label className="radio-label" key={status}>
        <input
          type="radio"
          name="options"
          className={`radio-input ${checked ? "radio-input_checked" : ""}`}
          value={status}
          checked={Boolean(currentStreakDay?.status === status)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onChange={() => {
            onUpdateStatus({
              status: status as Status,
              date: currentStreakDay?.date,
              notes: currentStreakDay?.notes,
            });
          }}
        />
        <span className="radio-custom" />
        {textByStatus[status as Status]}
      </label>
    );
  });
};

const textByStatus: Record<Status, string> = {
  [HABIT_STATUS.GOOD]: "✅",
  [HABIT_STATUS.BAD]: "❌",
  [HABIT_STATUS.NOT_SPECIFIED]: "⏳",
};
