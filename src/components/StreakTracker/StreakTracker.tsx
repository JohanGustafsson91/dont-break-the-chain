import { useEffect, useState } from "react";
import type { Habit } from "../../domain/Habit";
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  getGoodDays,
  getBadDays,
  markDay,
} from "../../domain/Habit";
import {
  getHabitById,
  updateHabit,
  deleteHabit,
} from "../../services/habitService";
import { Calendar } from "./Calendar";
import { getMonthName, createDate } from "../../utils/date";
import { pluralize } from "../../utils/string";
import { useNavigate, useParams } from "react-router-dom";
import { EditableTextField } from "./EditableTextField";
import "./StreakTracker.css";
import { StreakStat } from "./StreakStat";
import { ProgressBar } from "./ProgressBar";
import { HABIT_STATUS, STREAK_ICONS } from "../../shared/constants";
import { BottomSheet } from "./BottomSheet";
import { useAppBarContext } from "../AppBar/AppBar.Context";
import { StreakStatusRadioGroup } from "../StreakStatusRadioGroup/StreakStatusRadioGroup";

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

  async function onUpdateName(name: string) {
    if (!habit) return;
    try {
      await updateHabit(habit.id, { name });
      setHabit((prev) => prev ? { ...prev, name } : prev);
    } catch (error) {
      console.error("Could not update habit name", { error });
    }
  }

  async function onUpdateDescription(description: string) {
    if (!habit) return;
    try {
      await updateHabit(habit.id, { description });
      setHabit((prev) => prev ? { ...prev, description } : prev);
    } catch (error) {
      console.error("Could not update habit description", { error });
    }
  }

  async function handleUpdateDay(
    date: Date,
    status: typeof HABIT_STATUS[keyof typeof HABIT_STATUS],
    notes: string,
  ) {
    if (!habit) return;
    const previousHabit = habit;

    const notesWillBeLost = notes && status === HABIT_STATUS.NOT_SPECIFIED;
    if (notesWillBeLost && !window.confirm("Your notes will be lost")) {
      return;
    }

    const updatedHabit = markDay(habit, date, status, notes);

    try {
      setHabit(updatedHabit);
      await updateHabit(habit.id, { streak: updatedHabit.streak });
    } catch (error) {
      console.error("Could not update habit", { error });
      setHabit(previousHabit);
    }
  }

  function closeBottomSheet() {
    setActiveDate(undefined);
  }

  const currentStreakDay = habit.streak.find((s) => {
    if (!activeDate) return false;
    const sDate = createDate(s.date);
    const aDate = createDate(activeDate);
    return sDate.getTime() === aDate.getTime();
  });

  const currentStreakData = calculateCurrentStreak(habit);
  const longestStreakData = calculateLongestStreak(habit);

  return (
    <div className="page">
      <div className="form-element">
        <EditableTextField
          value={habit.name}
          type="text"
          onUpdate={onUpdateName}
          allowEmpty={false}
        />
      </div>

      <div className="form-element">
        <EditableTextField
          value={habit.description}
          type="textarea"
          onUpdate={onUpdateDescription}
        />
      </div>
      <div className="stats-row">
        <ProgressBar
          goodDays={getGoodDays(habit).length}
          badDays={getBadDays(habit).length}
        />
      </div>
      <div className="stats-row">
        <StreakStat
          icon={STREAK_ICONS.LONGEST}
          label="Longest"
          value={longestStreakData.count}
          unit={pluralize(longestStreakData.count, "day")}
        />
        <StreakStat
          icon={STREAK_ICONS.CURRENT}
          label="Current"
          value={currentStreakData.count}
          unit={pluralize(currentStreakData.count, "day")}
        />
      </div>

      <Calendar
        onSelectDate={handleSetActiveDate}
        streak={habit.streak}
        onUpdateDate={(args) => handleUpdateDay(args.date, args.status, args.notes)}
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
                    status: HABIT_STATUS.NOT_SPECIFIED,
                    date: activeDate,
                    notes: "",
                  }
                }
                onUpdateStatus={(values) =>
                  handleUpdateDay(values.date, values.status, values.notes)
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
                handleUpdateDay(currentStreakDay.date, currentStreakDay.status, notes)
              }
              disabled={!currentStreakDay?.status}
            />
          </div>
        </BottomSheet>
      ) : null}
    </div>
  );
};
