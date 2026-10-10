import type { DayInStreak } from "../../shared/Habit";
import { HABIT_STATUS } from "../../shared/constants";

type Status = (typeof HABIT_STATUS)[keyof typeof HABIT_STATUS];

interface Props {
  currentStreakDay: Omit<DayInStreak, "status"> & { status: Status };
  onUpdateStatus: (arg: { status: Status; date: Date; notes: string }) => void;
  groupName?: string;
  verbose?: boolean;
  allowBad?: boolean;
}

export const StreakStatusRadioGroup = ({
  currentStreakDay,
  onUpdateStatus,
  groupName = "status-group",
  verbose = false,
  allowBad = true,
}: Props) => {
  const statuses = allowBad
    ? [HABIT_STATUS.GOOD, HABIT_STATUS.BAD]
    : [HABIT_STATUS.GOOD];

  return statuses.map((status) => {
    const checked = currentStreakDay.status === status;

    return (
      <label
        className={`radio-label ${checked ? "radio-label-checked" : ""}`}
        data-status={status}
        key={status}
      >
        <input
          type="radio"
          name={groupName}
          className={`radio-input ${checked ? "radio-input_checked" : ""}`}
          // Screen readers would read the symbols as "check mark" and "ballot X".
          aria-label={verboseTextByStatus[status]}
          value={status}
          checked={checked}
          onClick={(e) => {
            // Not preventDefault: on a controlled radio it keeps the browser's checked
            // state stale, so assistive tech would announce the wrong status.
            e.stopPropagation();

            // Toggle behavior: if already checked, uncheck (set to NOT_SPECIFIED)
            if (checked) {
              onUpdateStatus({
                status: HABIT_STATUS.NOT_SPECIFIED,
                date: currentStreakDay?.date,
                notes: currentStreakDay?.notes,
              });
            }
          }}
          onChange={() => {
            // Only change if not already checked
            if (!checked) {
              onUpdateStatus({
                status: status,
                date: currentStreakDay?.date,
                notes: currentStreakDay?.notes,
              });
            }
          }}
        />
        <span className="radio-custom" />
        {textByStatus[status]}
        {verbose ? ` ${verboseTextByStatus[status]}` : ""}
      </label>
    );
  });
};

const textByStatus: Record<Status, string> = {
  [HABIT_STATUS.GOOD]: "✓",
  [HABIT_STATUS.BAD]: "✗",
  [HABIT_STATUS.NOT_SPECIFIED]: "⏳",
};

const verboseTextByStatus: Record<Status, string> = {
  [HABIT_STATUS.GOOD]: "Done",
  [HABIT_STATUS.BAD]: "Missed",
  [HABIT_STATUS.NOT_SPECIFIED]: "",
};
