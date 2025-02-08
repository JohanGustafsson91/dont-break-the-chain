import "./Calendar.css";
import type { DayInStreak } from "../../shared/Activity";
import {
  createDate,
  getMonthName,
  getWeekDayName,
  isBeforeOrSameDay,
  isSameDay,
} from "../../utils/date";

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
          Prev
        </button>
        <span>
          {getMonthName(currentDate)} {currentDate.getFullYear()}
        </span>
        <button
          type="button"
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
          Next
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
                className={`calendar-day ${isSameDay(day.date, currentDate) ? "calendar-day_active" : ""}`}
                key={day.date.toLocaleDateString()}
                style={styleByStatus[day.status]}
                onClick={() => {
                  isBeforeOrSameDay(day.date) && onSelectDate(day.date);
                }}
              >
                {day.number}
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

const styleByStatus = {
  GOOD: {
    backgroundColor: "green",
  },
  BAD: {
    backgroundColor: "red",
  },
  NOT_SPECIFIED: {
    backgroundColor: "inherit",
  },
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
