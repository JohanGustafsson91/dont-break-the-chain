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
import { StreakStat } from "./StreakStat";
import { ProgressBar } from "./ProgressBar";
import { findStreaks } from "../../shared/findStreaks";

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

  const { longestStreak, currentStreak } = findStreaks(habit?.streak ?? []);

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
      if (window.confirm("Are you sure you want to proceed?")) {
        await deleteHabit(id);
        navigate("/");
      }
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
      <div className="stats-row">
        <ProgressBar
          goodDays={habit.streak.filter((s) => s.status === "GOOD").length}
          badDays={habit.streak.filter((s) => s.status === "BAD").length}
        />
      </div>
      <div className="stats-row">
        <StreakStat
          icon="🔥"
          label="Longest"
          value={longestStreak.streak}
          unit={longestStreak.streak === 1 ? "day" : "days"}
        />
        <StreakStat
          icon="🔄"
          label="Current"
          value={currentStreak.streak}
          unit={currentStreak.streak === 1 ? "day" : "days"}
        />
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

      <button
        type="button"
        className="error"
        onClick={() => habit && onDelete(habit?.id)}
      >
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

type Status = DayInStreak["status"] | "NOT_SPECIFIED";
