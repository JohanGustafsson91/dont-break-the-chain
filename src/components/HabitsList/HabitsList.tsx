import "./HabitsList.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Habit } from "../../domain/Habit";
import {
  countGoodDaysInWeek,
  getGoodDays,
  getBadDays,
  getStreakSummary,
  markDay,
} from "../../domain/Habit";
import {
  addHabit,
  getAllHabits,
  updateHabit,
} from "../../services/habitService";
import { ProgressBar } from "../StreakTracker/ProgressBar";
import { HABIT_STATUS, STREAK_ICONS } from "../../shared/constants";
import { createDate, getToday } from "../../utils/date";
import { formatGoodShare, formatWeekProgress } from "../../utils/string";
import { StreakStatusRadioGroup } from "../StreakStatusRadioGroup/StreakStatusRadioGroup";
import { ConfirmDialog } from "../ConfirmDialog/ConfirmDialog";
import { useToast } from "../Toast/Toast.Context";
import { habitStatusLine } from "../../domain/statusLine";
import { recordTodayProgress, refreshTodayProgress } from "../../services/reminderService";

type Status = (typeof HABIT_STATUS)[keyof typeof HABIT_STATUS];

const itemClassByDayStatus = {
  [HABIT_STATUS.GOOD]: "HabitsList-item_success",
  [HABIT_STATUS.BAD]: "HabitsList-item_bad",
  [HABIT_STATUS.NOT_SPECIFIED]: "",
};

const todayLabel = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

export const HabitsList = () => {
  const [habits, setHabits] = useState<State>({ data: [], status: "pending" });
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  async function onCreateHabit() {
    try {
      const habitId = await addHabit();
      // A new habit is left to do today, even if everything else was done.
      void refreshTodayProgress();
      navigate(`/habits/${habitId}`, { state: { isNewHabit: true } });
    } catch (error) {
      console.error("Could not create habit", { error });
      showToast("Couldn't create the habit. Please try again.");
    }
  }

  useEffect(function fetchAndSetHabits() {
    (async () => {
      try {
        const data = await getAllHabits();
        setHabits({ data, status: "resolved" });
      } catch (error) {
        console.error("Could fetch habits", { error });
        setHabits({ data: [], status: "rejected" });
      }
    })();
  }, []);

  useEffect(
    function recordProgressForReminders() {
      // Also covers load, so habits added, deleted or changed elsewhere count too.
      // A failed save rolls the list back, and this runs again with the real state.
      if (habits.status === "resolved") void recordTodayProgress(habits.data);
    },
    [habits],
  );

  function navigateToDetailView(id: Habit["id"]) {
    return navigate(`/habits/${id}`);
  }

  function handleUpdateDay(
    habit: Habit,
    date: Date,
    status: Status,
    notes: string,
  ) {
    const notesWillBeLost = notes && status === HABIT_STATUS.NOT_SPECIFIED;

    if (notesWillBeLost) {
      setPendingRemoval({ notes, remove: () => saveDay(habit, date, status, notes) });
      return;
    }

    saveDay(habit, date, status, notes);
  }

  async function saveDay(
    habit: Habit,
    date: Date,
    status: Status,
    notes: string,
  ) {
    const previousHabit = habit;
    const updatedHabit = markDay(habit, date, status, notes);

    try {
      // Optimistic update
      setHabits((prev) => ({
        ...prev,
        data: prev.data.map((h) => (h.id === habit.id ? updatedHabit : h)),
      }));
      await updateHabit(habit.id, { streak: updatedHabit.streak });
    } catch (error) {
      console.error("Could not update habit", { error });
      showToast("Couldn't save that day. Please try again.");
      // Rollback
      setHabits((prev) => ({
        ...prev,
        data: prev.data.map((h) => (h.id === habit.id ? previousHabit : h)),
      }));
    }
  }

  return (
    <>
      <div className="page HabitsList">
        <div className="HabitsList-date">{todayLabel()}</div>
        <h1 className="HabitsList-title">Your habits</h1>

        {
          {
            resolved:
              habits.data.length === 0 ? (
                <div className="HabitsList-empty">
                  <div className="HabitsList-empty-icon">🎯</div>
                  <div className="HabitsList-empty-title">No habits yet</div>
                  <div className="HabitsList-empty-text">
                    Pick one thing you want to do every day and create your
                    first habit.
                  </div>
                </div>
              ) : (
                habits.data.map((habit) => {
                  const { id, name } = habit;
                  const goodDays = getGoodDays(habit).length;
                  const badDays = getBadDays(habit).length;
                  const { goal } = habit;
                  const today = getToday();
                  const goodDaysThisWeek = countGoodDaysInWeek(habit, today);
                  const streak = getStreakSummary(habit);
                  const streakSuffix = streak.unit === "week" ? " wk" : "";
                  const currentStreakDay = habit.streak.find(
                    (s) => createDate(s.date).getTime() === today.getTime(),
                  );
                  const currentDayStatus =
                    currentStreakDay?.status ?? HABIT_STATUS.NOT_SPECIFIED;

                  return (
                    <div
                      className={`HabitsList-item ${itemClassByDayStatus[currentDayStatus]}`}
                      key={id}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest(".radio-group")) {
                          return;
                        }

                        navigateToDetailView(id);
                      }}
                    >
                      <div className="HabitsList-item_row HabitsList-item_header">
                        <div className="HabitsList-item_text">
                          <span className="HabitsList-item_title" title={name}>
                            {name}
                          </span>
                          <span className="HabitsList-status-text">
                            {habitStatusLine(habit)}
                          </span>
                        </div>

                        <div className="radio-group">
                          <StreakStatusRadioGroup
                            currentStreakDay={
                              currentStreakDay ?? {
                                status: HABIT_STATUS.NOT_SPECIFIED,
                                date: today,
                                notes: "",
                              }
                            }
                            groupName={`habit-${id}`}
                            allowBad={goal.type === "daily"}
                            onUpdateStatus={(values) =>
                              handleUpdateDay(
                                habit,
                                values.date,
                                values.status,
                                values.notes,
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="HabitsList-item_progress">
                        {goal.type === "weekly" ? (
                          <ProgressBar
                            goodDays={Math.min(goodDaysThisWeek, goal.times)}
                            badDays={0}
                            total={goal.times}
                          />
                        ) : (
                          <ProgressBar goodDays={goodDays} badDays={badDays} />
                        )}
                        <div className="HabitsList-item_row HabitsList-item_stats">
                          <span>
                            {goal.type === "weekly"
                              ? formatWeekProgress(goodDaysThisWeek, goal.times)
                              : formatGoodShare(goodDays, badDays)}
                          </span>
                          <div className="HabitsList-item_streaks">
                            <span>
                              <span>{STREAK_ICONS.CURRENT}</span> Current{" "}
                              <b>{streak.current}{streakSuffix}</b>
                            </span>
                            <span>
                              <span>{STREAK_ICONS.LONGEST}</span> Longest{" "}
                              <b>{streak.longest}{streakSuffix}</b>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ),
            pending: <p className="loading">Fetching habits</p>,
            rejected: (
              <p className="HabitsList-error" role="alert">
                Couldn't load your habits. Check your connection and reload the page.
              </p>
            ),
          }[habits.status]
        }

        {habits.status === "resolved" ? (
          habits.data.length === 0 ? (
            <button type="button" className="HabitsList-create_first" onClick={onCreateHabit}>
              + Create habit
            </button>
          ) : (
            <button type="button" className="HabitsList-create" onClick={onCreateHabit}>
              + New habit
            </button>
          )
        ) : null}
      </div>

      {pendingRemoval ? (
        <ConfirmDialog
          title="Remove status?"
          body={`The note for this day will be deleted too: “${pendingRemoval.notes}”`}
          confirmLabel="Remove"
          onCancel={() => setPendingRemoval(undefined)}
          onConfirm={() => {
            setPendingRemoval(undefined);
            pendingRemoval.remove();
          }}
        />
      ) : null}
    </>
  );
};

interface PendingRemoval {
  notes: string;
  remove: () => void;
}

interface State {
  data: Habit[];
  status: "pending" | "resolved" | "rejected";
}
