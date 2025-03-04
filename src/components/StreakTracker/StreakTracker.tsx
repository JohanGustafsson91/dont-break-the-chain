import { useEffect, useState } from "react";
import type { Habit, DayInStreak } from "../../shared/Habit";
import { Calendar } from "./Calendar";
import { getMonthName, isSameDay } from "../../utils/date";
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
import { LOG } from "../../utils/logger";
import { BottomSheet } from "./BottomSheet";
import { useAppBarContext } from "../AppBar/AppBar.Context";
import { textByStatus } from "../../shared/textByStatus";
import { Status } from "../../shared/Status";

export const StreakTracker = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [habit, setHabit] = useState<Habit>();
  const [activeDate, setActiveDate] = useState<Date | undefined>();
  const { renderAppBarItems } = useAppBarContext();

  useEffect(
    function fetchAndSetHabit() {
      const fetchHabit = async (id: string) => {
        const data = await getHabitById(id);
        setHabit(data);
      };

      if (id) fetchHabit(id);
    },
    [id],
  );

  useEffect(
    function renderDeleteOptionInAppBar() {
      if (!habit?.id) {
        return;
      }

      async function onDelete(id: Habit["id"]) {
        try {
          if (window.confirm("Are you sure you want to proceed?")) {
            await deleteHabit(id);
            navigate("/");
          }
        } catch (error) {
          LOG.error("Could not delete habit...", { error });
        }
      }

      renderAppBarItems(
        <button type="button" onClick={() => onDelete(habit.id)}>
          Delete
        </button>,
      );
    },
    [habit?.id, renderAppBarItems, navigate],
  );

  if (!habit) {
    return null;
  }

  function handleSetActiveDate(date: Date) {
    setActiveDate(date);
  }

  async function onUpdateHabit(id: Habit["id"], data: Partial<Habit>) {
    try {
      await updateHabit(id, data);
    } catch (error) {
      LOG.error("Could not update habit", { error });
    }
  }

  async function handleUpdateStreak({
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
        { date, status, notes: "" },
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
      LOG.error("Could not update habit", { error });

      setHabit((prev) =>
        prev ? ({ ...prev, streak: previousStreak } as Habit) : prev,
      );
    }
  }

  function closeBottomSheet() {
    setActiveDate(undefined);
  }

  const currentStreakDay = habit.streak.find(
    (s) => activeDate && isSameDay(s.date, activeDate),
  );

  const { longestStreak, currentStreak } = findStreaks(habit.streak);

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

      <Calendar
        onSelectDate={handleSetActiveDate}
        streak={habit.streak}
        onUpdateDate={handleUpdateStreak}
      />

      {activeDate ? (
        <BottomSheet onClose={closeBottomSheet}>
          <div className="edit-day-pane">
            <h3>
              {activeDate.getDate()} {getMonthName(activeDate)}
            </h3>
            <div className="radio-group form-element">
              {["GOOD", "BAD", "NOT_SPECIFIED"].map((status) => (
                <label className="radio-label" key={status}>
                  <input
                    type="radio"
                    name="options"
                    className="radio-input"
                    value={status}
                    checked={Boolean(
                      (currentStreakDay?.status ?? "NOT_SPECIFIED") === status,
                    )}
                    onChange={(e) => {
                      handleUpdateStreak({
                        date: activeDate,
                        status: e.target.value as Status,
                        notes: "",
                      });
                      closeBottomSheet();
                    }}
                  />
                  <span className="radio-custom"></span>
                  {textByStatus[status]}
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
                currentStreakDay &&
                handleUpdateStreak({ ...currentStreakDay, notes })
              }
              disabled={!currentStreakDay?.status}
            />
          </div>
        </BottomSheet>
      ) : null}
    </div>
  );
};
