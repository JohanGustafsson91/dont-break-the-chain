import "./Calendar.css";
import type { DayInStreak } from "../../shared/Habit";
import {
  createDate,
  getMonthName,
  getToday,
  getWeekDayName,
  isBeforeOrSameDay,
  isNextMonthDisabled,
  isSameDay,
} from "../../utils/date";
import { NextMonthIcon } from "./NextMonthIcon";
import { PrevMonthIcon } from "./PrevMonthIcon";
import { useState } from "react";
import { HABIT_STATUS } from "../../shared/constants";
import { countGoodDaysInWeek, type Goal } from "../../domain/Habit";

interface Props {
  streak: DayInStreak[];
  goal: Goal;
  onSelectDate: (date: Date) => void;
  onUpdateDate: (args: {
    date: Date;
    status: DayInStreak["status"] | typeof HABIT_STATUS.NOT_SPECIFIED;
    notes: DayInStreak["notes"];
  }) => void;
}

export const Calendar = ({
  streak,
  goal,
  onSelectDate,
  onUpdateDate,
}: Props) => {
  const nextStatus =
    goal.type === "weekly" ? nextWeeklyStatusMap : newStatusMap;

  // First day of the visible month, as UTC midnight like every calendar day.
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = getToday();
    return createDate({
      year: today.getUTCFullYear(),
      month: today.getUTCMonth(),
      day: 1,
    });
  });
  const [year, month] = [
    visibleMonth.getUTCFullYear(),
    visibleMonth.getUTCMonth(),
  ];
  const numberOfDaysInMonth = createDate({ year, month: month + 1, day: 0 })
    .getUTCDate();

  const daysInMonthWithStreakData = Array.from(
    { length: numberOfDaysInMonth },
    (_, number) => {
      const day = number + 1;
      const date = createDate({ year, month, day });
      const { status = HABIT_STATUS.NOT_SPECIFIED, notes = "" } =
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

  const today = getToday();

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
          aria-label="Previous month"
          onClick={() =>
            setVisibleMonth(createDate({ year, month: month - 1, day: 1 }))
          }
        >
          <PrevMonthIcon />
        </button>
        <span>
          {getMonthName(visibleMonth)} {year}
        </span>
        <button
          className="icon-button"
          type="button"
          aria-label="Next month"
          disabled={isNextMonthDisabled(visibleMonth)}
          onClick={() =>
            setVisibleMonth(createDate({ year, month: month + 1, day: 1 }))
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
        <div
          key={`week-${weekNumber}`}
          className={
            isWeekGoalReached(goal, streak, week)
              ? "Calendar-week_complete"
              : undefined
          }
        >
          {week.map((day, weekDay) => {
            if (typeof day === "number") {
              return <div className="Calendar-day Calendar-day_empty" key={day} />;
            }

            const isToday = isSameDay(day.date, today);
            const todayClassName = isToday ? "Calendar-day_today" : "";
            const futureClassName = isBeforeOrSameDay(day.date, today)
              ? ""
              : "Calendar-day_future";

            // Links don't wrap to the next week row or into the next month.
            const nextDay = daysInMonthWithStreakData[day.number];
            const linkedClassName =
              goal.type === "daily" &&
              day.status === HABIT_STATUS.GOOD &&
              nextDay?.status === HABIT_STATUS.GOOD &&
              weekDay < 6
                ? "Calendar-day_linked"
                : "";

            const hintAboutTodayClassName =
              isToday && day.status === "NOT_SPECIFIED"
                ? "Calendar-day_pulsate"
                : "";

            return (
              <div
                className={`Calendar-day ${classNameByStatus[day.status]} ${todayClassName} ${futureClassName} ${linkedClassName} ${hintAboutTodayClassName}`}
                key={day.date.toISOString()}
                title={`Day ${day.number}`}
                {...(isBeforeOrSameDay(day.date, today) &&
                  clickHelpers({
                    onLongClick: () => onSelectDate(day.date),
                    onClick: () =>
                      onUpdateDate({
                        date: day.date,
                        status: nextStatus[day.status],
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

      <div className="Calendar-legend">
        <span>Tap to cycle status</span>
        <span>Hold to add a note</span>
        <span>* has a note</span>
        {goal.type === "weekly" ? <span>Lit week = goal reached</span> : null}
      </div>
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

// Unmarked days are neutral for weekly goals, so there's no ✗ in the cycle.
const nextWeeklyStatusMap = {
  NOT_SPECIFIED: "GOOD",
  GOOD: "NOT_SPECIFIED",
  BAD: "NOT_SPECIFIED",
} as const;

function isWeekGoalReached(
  goal: Goal,
  streak: DayInStreak[],
  week: Array<number | { date: Date }>,
) {
  const firstDay = week.find((day) => typeof day !== "number");

  return (
    goal.type === "weekly" &&
    typeof firstDay === "object" &&
    countGoodDaysInWeek({ streak }, firstDay.date) >= goal.times
  );
}

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
  const ref: { current: ReturnType<typeof setTimeout> | undefined } = { current: undefined };

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
