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

import { BottomSheet } from "./BottomSheet";
import { useAppBarContext } from "../AppBar/AppBar.Context";
import { StreakStatusRadioGroup } from "../StreakStatusRadioGroup/StreakStatusRadioGroup";
import {
  getUpdatedStreak,
  GetUpdatedStreak,
} from "../../shared/getUpdatedStreak";

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
          console.error("Could not delete habit...", { error });
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
      console.error("Could not update habit", { error });
    }
  }

  async function handleUpdateStreak(args: GetUpdatedStreak) {
    const { habit } = args;

    if (!habit) {
      return;
    }

    const notesWillBeLost = args.notes && args.status === "NOT_SPECIFIED";
    if (notesWillBeLost && !window.confirm("You notes will be lost")) {
      return;
    }

    const { streak, previousStreak } = getUpdatedStreak(args);
    const updateState = (streak: DayInStreak[]) => (prev: Habit | undefined) =>
      prev ? ({ ...prev, streak } as Habit) : prev;

    try {
      setHabit(updateState(streak));
      await updateHabit(habit.id, { streak });
    } catch (error) {
      console.error("Could not update habit", { error });
      setHabit(updateState(previousStreak));
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
        onUpdateDate={(args) => handleUpdateStreak({ ...args, habit })}
      />

      {activeDate ? (
        <BottomSheet onClose={closeBottomSheet}>
          <div className="edit-day-pane">
            <h3>
              {activeDate.getDate()} {getMonthName(activeDate)}
            </h3>
            <div className="radio-group form-element">
              <StreakStatusRadioGroup
                currentStreakDay={
                  currentStreakDay ?? {
                    status: "NOT_SPECIFIED",
                    date: activeDate,
                    notes: "",
                  }
                }
                onUpdateStatus={(values) =>
                  handleUpdateStreak({ ...values, habit })
                }
              />
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
                handleUpdateStreak({ ...currentStreakDay, notes, habit })
              }
              disabled={!currentStreakDay?.status}
            />
          </div>
        </BottomSheet>
      ) : null}
    </div>
  );
};
