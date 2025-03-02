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
import { useState } from "react";

interface Props {
  streak: DayInStreak[];
  onSelectDate: (date: Date) => void;
  onUpdateDate: (args: {
    date: Date;
    status: DayInStreak["status"] | "NOT_SPECIFIED";
    notes: DayInStreak["notes"];
  }) => void;
}

export const Calendar = ({ streak, onSelectDate, onUpdateDate }: Props) => {
  const [activeDate, setActiveDate] = useState(new Date());
  const [year, month] = [activeDate.getFullYear(), activeDate.getMonth()];
  const numberOfDaysInMonth = new Date(year, month + 1, 0).getDate();

  const daysInMonthWithStreakData = Array.from(
    { length: numberOfDaysInMonth },
    (_, number) => {
      const day = number + 1;
      const date = createDate({ year, month, day });
      const { status = "NOT_SPECIFIED", notes = "" } =
        streak.find((s) => isSameDay(s.date, date)) || {};

      return {
        number: day,
        date,
        name: getWeekDayName(date),
        status,
        notes,
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
    <div className="Calendar">
      <div className="Calendar-menu">
        <button
          className="icon-button"
          type="button"
          onClick={() =>
            setActiveDate(
              createDate({
                year: activeDate.getFullYear(),
                month: activeDate.getMonth() - 1,
                day: 1,
              }),
            )
          }
        >
          <PrevMonthIcon />
        </button>
        <span>
          {getMonthName(activeDate)} {activeDate.getFullYear()}
        </span>
        <button
          className="icon-button"
          type="button"
          disabled={isNextMonthDisabled(activeDate)}
          onClick={() =>
            setActiveDate(
              createDate({
                year: activeDate.getFullYear(),
                month: activeDate.getMonth() + 1,
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
          <div className="Calendar-day Calendar-day_week-name" key={name}>
            {name.charAt(0)}
          </div>
        ))}
      </div>

      {weeksWithDays.map((week, weekNumber) => (
        <div key={`week-${weekNumber}`}>
          {week.map((day) => {
            if (typeof day === "number") {
              return <div className="Calendar-day" key={day} />;
            }

            const activeClassName = isSameDay(day.date, activeDate)
              ? "Calendar-day_active"
              : "";

            const hintAboutTodayClassName =
              isSameDay(day.date, new Date()) && day.status === "NOT_SPECIFIED"
                ? "Calendar-day_pulsate"
                : "";

            return (
              <div
                className={`Calendar-day ${classNameByStatus[day.status]} ${activeClassName} ${hintAboutTodayClassName}`}
                key={day.date.toLocaleDateString()}
                {...(isBeforeOrSameDay(day.date) &&
                  clickHelpers({
                    onLongClick: () => onSelectDate(day.date),
                    onClick: () =>
                      onUpdateDate({
                        date: day.date,
                        status: newStatusMap[day.status],
                        notes: day.notes,
                      }),
                  }))}
              >
                {day.number}
                {day.notes ? "*" : ""}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const classNameByStatus = {
  GOOD: "Calendar-day_success",
  BAD: "Calendar-day_error",
  NOT_SPECIFIED: "",
};

const newStatusMap = {
  NOT_SPECIFIED: "GOOD",
  GOOD: "BAD",
  BAD: "NOT_SPECIFIED",
} as const;

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

interface ClickHelpers {
  onLongClick?: () => void;
  onClick?: () => void;
}

function clickHelpers({ onClick, onLongClick }: ClickHelpers) {
  const ref: { current: NodeJS.Timeout | undefined } = { current: undefined };

  function handleDown(e: React.PointerEvent<HTMLElement>) {
    if (e.type === "mousedown") e.preventDefault();

    ref.current = setTimeout(() => {
      onLongClick?.();
      clearTimer();
    }, 500);
  }

  function clearTimer() {
    clearTimeout(ref.current);
    ref.current = undefined;
  }

  function handleUp() {
    if (ref.current) {
      onClick?.();
    }

    clearTimer();
  }

  return {
    onPointerDown: handleDown,
    onPointerUp: handleUp,
  };
}
