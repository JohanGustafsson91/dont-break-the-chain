import { useState } from "react";
import type { Activity, DayInStreak } from "../../shared/Activity";
import { Calendar } from "./Calendar";
import { mockData } from "./StreakTracker.mockData";
import { createDate, getMonthName, isSameDay } from "../../utils/date";

export const StreakTracker = () => {
  const [activity, setActivity] = useState<Activity>({
    name: "Träna",
    description: "Träna varje dag eller hoppa en minut.",
    streak: mockData,
  });
  const [activeDate, setActiveDate] = useState(createDate(new Date()));
  const { longestStreak, currentStreak } = findStreaks(activity.streak);

  function handleSetActiveDate(date: Date) {
    setActiveDate(date);
  }

  function handleChangeStatusForDate({
    date,
    status,
  }: {
    date: Date;
    status: Status;
  }) {
    if (status === "NOT_SPECIFIED") {
      return setActivity((prev) => ({
        ...prev,
        streak: prev.streak.filter((s) => !isSameDay(s.date, date)),
      }));
    }

    const shouldUpdate = activity.streak.find((s) => isSameDay(s.date, date));

    setActivity((prev) => ({
      ...prev,
      streak: shouldUpdate
        ? prev.streak.map((s) =>
            isSameDay(s.date, date) ? { ...s, status } : s,
          )
        : [
            ...prev.streak,
            {
              date,
              status,
              notes: "",
            },
          ],
    }));
  }

  return (
    <div className="page">
      <h2>{activity.name}</h2>
      <p>{activity.description}</p>

      <div style={{ marginBottom: 24 }}>
        <div>Longest streak: {longestStreak.streak} days</div>
        <div>Current streak: {currentStreak.streak} days</div>
        <div>
          Good: {activity.streak.filter((s) => s.status === "GOOD").length} days
        </div>
        <div>
          Bad: {activity.streak.filter((s) => s.status === "BAD").length} days
        </div>
        <div>Rate: {getRate(activity.streak)}%</div>
      </div>

      <div>
        <p>
          {activeDate.getDate()} {getMonthName(activeDate)}
        </p>
        <div>
          {["GOOD", "BAD", "NOT_SPECIFIED"].map((status) => (
            <label key={status} style={{ marginRight: "10px" }}>
              <input
                type="radio"
                name="status"
                value={status}
                checked={
                  (activity.streak.find((s) => isSameDay(s.date, activeDate))
                    ?.status ?? "NOT_SPECIFIED") === status
                }
                onChange={(e) =>
                  handleChangeStatusForDate({
                    date: activeDate,
                    status: e.target.value as Status,
                  })
                }
              />
              {status}
            </label>
          ))}
        </div>
      </div>

      <Calendar
        onChangeDate={handleSetActiveDate}
        onSelectDate={handleSetActiveDate}
        streak={activity.streak}
        currentDate={activeDate}
      />
    </div>
  );
};

function findStreaks(dates: DayInStreak[]): {
  longestStreak: { from: Date; to: Date; streak: number };
  currentStreak: { from: Date; to: Date; streak: number };
} {
  if (dates.length === 0)
    return {
      longestStreak: { from: new Date(), to: new Date(), streak: 0 },
      currentStreak: { from: new Date(), to: new Date(), streak: 0 },
    };

  const goodDates = dates
    .filter((day) => day.status === "GOOD")
    .map((day) => createDate(day.date));

  if (goodDates.length === 0)
    return {
      longestStreak: { from: new Date(), to: new Date(), streak: 0 },
      currentStreak: { from: new Date(), to: new Date(), streak: 0 },
    };

  const streaks = goodDates
    .sort((a, b) => a.getTime() - b.getTime())
    .reduce(
      (acc, curr, i, arr) => {
        const streakStart =
          i === 0 || !isNextDay(arr[i - 1], curr)
            ? curr
            : acc[acc.length - 1].from;
        const streakEnd = curr;

        if (i === 0 || !isNextDay(arr[i - 1], curr)) {
          acc.push({ from: streakStart, to: streakEnd, streak: 1 });
        } else {
          acc[acc.length - 1].to = streakEnd;
          acc[acc.length - 1].streak += 1;
        }
        return acc;
      },
      [] as { from: Date; to: Date; streak: number }[],
    );

  const longestStreak = streaks.reduce(
    (max, streak) => (streak.streak > max.streak ? streak : max),
    streaks[0],
  );

  const currentStreak = streaks[streaks.length - 1];

  return {
    longestStreak,
    currentStreak,
  };
}

function isNextDay(prev: Date, current: Date): boolean {
  return (
    Date.UTC(
      current.getUTCFullYear(),
      current.getUTCMonth(),
      current.getUTCDate(),
    ) -
      Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth(), prev.getUTCDate()) ===
    86400000
  ); // 1 day in ms
}

function getRate(streak: DayInStreak[]) {
  const goodDays = streak.filter((s) => s.status === "GOOD").length;
  const badDays = streak.filter((s) => s.status === "BAD").length;
  const total = goodDays + badDays;

  return total === 0 ? "0.0" : ((goodDays / total) * 100).toFixed(1);
}

type Status = DayInStreak["status"] | "NOT_SPECIFIED";
