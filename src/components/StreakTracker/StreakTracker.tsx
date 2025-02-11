import { useEffect, useState } from "react";
import type { Habit, DayInStreak } from "../../shared/Habit";
import { Calendar } from "./Calendar";
import { createDate, getMonthName, isSameDay } from "../../utils/date";
import { useNavigate, useParams } from "react-router-dom";
import { EditableTextField } from "./EditableTextField";
import "./StreakTracker.css";
import {
  deleteHabit,
  getHabitById,
  updateHabit,
} from "../../services/habitService";

export const StreakTracker = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [habit, setHabit] = useState<Habit>();
  const [activeDate, setActiveDate] = useState(createDate(new Date()));

  useEffect(
    function fetchHabit() {
      const fetchHabit = async (id: string) => {
        const data = await getHabitById(id);
        setHabit(data);
      };

      id && fetchHabit(id);
    },
    [id],
  );
  // const { longestStreak, currentStreak } = {
  //   longestStreak: { streak: 0 },
  //   currentStreak: { streak: 0 },
  // };

  function handleSetActiveDate(date: Date) {
    setActiveDate(date);
  }

  async function onUpdateHabit(id: Habit["id"], data: Partial<Habit>) {
    try {
      await updateHabit(id, data);
    } catch (error) {
      console.info("Could not update habit");
    }
  }

  async function updateStreak({
    date,
    status,
    notes = "",
  }: {
    date: DayInStreak["date"];
    status: Status;
    notes?: DayInStreak["notes"];
  }) {
    if (!habit) {
      return;
    }

    const actionMap = {
      remove: (streak: Habit["streak"]) =>
        streak.filter((s) => !isSameDay(s.date, date)),
      add: (streak: Habit["streak"]) => [
        ...streak,
        {
          date,
          status,
          notes: "",
        },
      ],
      update: (streak: Habit["streak"]) =>
        streak.map((s) =>
          isSameDay(s.date, date) ? { ...s, status, notes } : s,
        ),
    };

    const doAction =
      status === "NOT_SPECIFIED"
        ? "remove"
        : habit.streak.find((s) => isSameDay(s.date, date))
          ? "update"
          : "add";

    const streak = actionMap[doAction](habit.streak) as DayInStreak[];
    const previousStreak = habit.streak;

    try {
      setHabit((prev) => (prev ? ({ ...prev, streak } as Habit) : prev));
      await updateHabit(habit.id, { streak });
    } catch (error) {
      setHabit((prev) =>
        prev ? ({ ...prev, streak: previousStreak } as Habit) : prev,
      );
    }
  }

  async function onDelete(id: Habit["id"]) {
    try {
      await deleteHabit(id);
      navigate("/");
    } catch (error) {
      console.log("Could not delete habit...", error);
    }
  }

  if (!habit) {
    return null;
  }

  const currentStreakDay = habit?.streak?.find((s) =>
    isSameDay(s.date, activeDate),
  );

  return (
    <div className="page">
      <div className="form-element">
        <EditableTextField
          value={habit.name}
          type="text"
          onUpdate={(name) => onUpdateHabit(habit.id, { name })}
          allowEmpty={false}
        />
      </div>

      <div className="form-element">
        <EditableTextField
          value={habit.description}
          type="textarea"
          onUpdate={(description) => onUpdateHabit(habit.id, { description })}
        />
      </div>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {/* <div>Longest streak: {longestStreak.streak} days</div> */}
        {/* <div>Current streak: {currentStreak.streak} days</div> */}
        <div>
          Good: {habit.streak.filter((s) => s.status === "GOOD").length} days
        </div>
        <div>
          Bad: {habit.streak.filter((s) => s.status === "BAD").length} days
        </div>
        <div>Rate: {getRate(habit.streak)}%</div>
      </div>

      <div>
        <div className="edit-day-pane">
          <p>
            {activeDate.getDate()} {getMonthName(activeDate)}
          </p>
          <div>
            {["GOOD", "BAD", "NOT_SPECIFIED"].map((status) => (
              <label key={status}>
                <input
                  type="radio"
                  name="status"
                  value={status}
                  checked={Boolean(
                    (currentStreakDay?.status ?? "NOT_SPECIFIED") === status,
                  )}
                  onChange={(e) =>
                    updateStreak({
                      date: activeDate,
                      status: e.target.value as Status,
                      notes: "",
                    })
                  }
                />
                {textByStatus[status as Status]}
              </label>
            ))}
          </div>
        </div>

        <div className="form-element">
          <EditableTextField
            key={currentStreakDay?.date?.toISOString()}
            type="textarea"
            placeholder="Enter notes"
            value={currentStreakDay?.notes ?? ""}
            onUpdate={(notes) =>
              currentStreakDay && updateStreak({ ...currentStreakDay, notes })
            }
            disabled={!currentStreakDay?.status}
          />
        </div>
      </div>

      <Calendar
        onChangeDate={handleSetActiveDate}
        onSelectDate={handleSetActiveDate}
        streak={habit.streak}
        currentDate={activeDate}
      />

      <button type="button" onClick={() => habit && onDelete(habit?.id)}>
        Delete habit
      </button>
    </div>
  );
};

const textByStatus = {
  GOOD: "✅",
  BAD: "❌",
  NOT_SPECIFIED: "⏳",
};
// function findStreaks(dates: DayInStreak[]): {
//   longestStreak: { from: Date; to: Date; streak: number };
//   currentStreak: { from: Date; to: Date; streak: number };
// } {
//   if (dates.length === 0)
//     return {
//       longestStreak: { from: new Date(), to: new Date(), streak: 0 },
//       currentStreak: { from: new Date(), to: new Date(), streak: 0 },
//     };
//
//   const goodDates = dates
//     .filter((day) => day.status === "GOOD")
//     .map((day) => createDate(day.date));
//
//   if (goodDates.length === 0)
//     return {
//       longestStreak: { from: new Date(), to: new Date(), streak: 0 },
//       currentStreak: { from: new Date(), to: new Date(), streak: 0 },
//     };
//
//   const streaks = goodDates
//     .sort((a, b) => a.getTime() - b.getTime())
//     .reduce(
//       (acc, curr, i, arr) => {
//         const streakStart =
//           i === 0 || !isNextDay(arr[i - 1], curr)
//             ? curr
//             : acc[acc.length - 1].from;
//         const streakEnd = curr;
//
//         if (i === 0 || !isNextDay(arr[i - 1], curr)) {
//           acc.push({ from: streakStart, to: streakEnd, streak: 1 });
//         } else {
//           acc[acc.length - 1].to = streakEnd;
//           acc[acc.length - 1].streak += 1;
//         }
//         return acc;
//       },
//       [] as { from: Date; to: Date; streak: number }[],
//     );
//
//   const longestStreak = streaks.reduce(
//     (max, streak) => (streak.streak > max.streak ? streak : max),
//     streaks[0],
//   );
//
//   const currentStreak = streaks[streaks.length - 1];
//
//   return {
//     longestStreak,
//     currentStreak,
//   };
// }

// function isNextDay(prev: Date, current: Date): boolean {
//   return (
//     Date.UTC(
//       current.getUTCFullYear(),
//       current.getUTCMonth(),
//       current.getUTCDate(),
//     ) -
//       Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth(), prev.getUTCDate()) ===
//     86400000
//   ); // 1 day in ms
// }

function getRate(streak: DayInStreak[]) {
  const goodDays = streak.filter((s) => s.status === "GOOD").length;
  const badDays = streak.filter((s) => s.status === "BAD").length;
  const total = goodDays + badDays;

  return total === 0 ? "0.0" : ((goodDays / total) * 100).toFixed(1);
}

type Status = DayInStreak["status"] | "NOT_SPECIFIED";
