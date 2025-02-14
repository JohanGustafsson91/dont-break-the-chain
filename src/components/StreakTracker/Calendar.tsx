import "./Calendar.css";
import type { DayInStreak } from "../../shared/Habit";
import {
  createDate,
  getMonthName,
  getWeekDayName,
  isBeforeOrSameDay,
  isNextMonthDisabled,
  isSameDay,
} from "../../utils/date";
import { NextMonthIcon } from "./NextMonthIcon";
import { PrevMonthIcon } from "./PrevMonthIcon";

export const Calendar = ({
  currentDate = new Date(),
  streak,
  onSelectDate,
  onChangeDate,
}: Props) => {
  const [year, month] = [currentDate.getFullYear(), currentDate.getMonth()];
  const numberOfDaysInMonth = new Date(year, month, 0).getDate();

  const daysInMonthWithStreakData = Array.from(
    { length: numberOfDaysInMonth },
    (_, number) => {
      const day = number + 1;
      const date = createDate({ year, month, day });
      const dayInStreak = streak.find((s) => isSameDay(s.date, date));

      return {
        number: day,
        date,
        name: getWeekDayName(date),
        status: dayInStreak?.status ?? "NOT_SPECIFIED",
        notes: dayInStreak?.notes ?? "",
      } as const;
    },
  );

  const [firstDayInMonth] = daysInMonthWithStreakData;
  const padNumberOfDaysToAlignWithWeekDays = dayNamesInWeek.indexOf(
    firstDayInMonth.name,
  );

  const weeksWithDays = splitIntoChunks([
    ...Array.from({ length: padNumberOfDaysToAlignWithWeekDays }, (_, i) => i),
    ...daysInMonthWithStreakData,
  ]);

  return (
    <div className="calendar">
      <div className="calendar-menu">
        <button
          className="icon-button"
          type="button"
          onClick={() =>
            onChangeDate(
              createDate({
                year: currentDate.getFullYear(),
                month: currentDate.getMonth() - 1,
                day: 1,
              }),
            )
          }
        >
          <PrevMonthIcon />
        </button>
        <span>
          {getMonthName(currentDate)} {currentDate.getFullYear()}
        </span>
        <button
          className="icon-button"
          type="button"
          disabled={isNextMonthDisabled(currentDate)}
          onClick={() =>
            onChangeDate(
              createDate({
                year: currentDate.getFullYear(),
                month: currentDate.getMonth() + 1,
                day: 1,
              }),
            )
          }
        >
          <NextMonthIcon />
        </button>
      </div>

      <div>
        {dayNamesInWeek.map((name) => (
          <div className="calendar-day calendar-day_week-name" key={name}>
            {name.charAt(0)}
          </div>
        ))}
      </div>

      {weeksWithDays.map((week, weekNumber) => (
        <div key={`week-${weekNumber}`}>
          {week.map((day) => {
            return typeof day !== "number" ? (
              <div
                className={`calendar-day ${classNameByStatus[day.status]} ${isSameDay(day.date, currentDate) ? "calendar-day_active" : ""}`}
                key={day.date.toLocaleDateString()}
                onClick={() => {
                  isBeforeOrSameDay(day.date) && onSelectDate(day.date);
                }}
              >
                {day.number} {day.notes ? "*" : ""}
              </div>
            ) : (
              <div className="calendar-day" key={day} />
            );
          })}
        </div>
      ))}
    </div>
  );
};

const classNameByStatus = {
  GOOD: "calendar-day_success",
  BAD: "calendar-day_error",
  NOT_SPECIFIED: "",
};

const dayNamesInWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function splitIntoChunks<T>(arr: T[], size: number = 7): T[][] {
  return arr.reduce<T[][]>(
    (acc, _, i) => (i % size === 0 ? [...acc, arr.slice(i, i + size)] : acc),
    [],
  );
}

interface Props {
  currentDate?: Date;
  streak: DayInStreak[];
  onSelectDate: (date: Date) => void;
  onChangeDate: (date: Date) => void;
}
