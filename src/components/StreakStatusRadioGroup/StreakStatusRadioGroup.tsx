import { DayInStreak } from "../../shared/Habit";
import { Status } from "../../shared/Status";

interface Props {
  currentStreakDay: Omit<DayInStreak, "status"> & { status: Status };
  onUpdateStatus: (arg: { status: Status; date: Date }) => void;
}

export const StreakStatusRadioGroup = ({
  currentStreakDay,
  onUpdateStatus,
}: Props) => {
  return ["GOOD", "BAD", "NOT_SPECIFIED"].map((status) => {
    const checked = Boolean(
      (currentStreakDay?.status ?? "NOT_SPECIFIED") === status,
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
            });
          }}
        />
        <span className="radio-custom"></span>
        {textByStatus[status as Status]}
      </label>
    );
  });
};

const textByStatus: Record<Status, string> = {
  GOOD: "✅",
  BAD: "❌",
  NOT_SPECIFIED: "⏳",
};
