import { useEffect, useMemo, useState } from "react";
import type { Goal, Habit } from "../../domain/Habit";
import {
  countGoodDaysInWeek,
  getGoodDays,
  getBadDays,
  getStreakSummary,
  markDay,
} from "../../domain/Habit";
import {
  getHabitById,
  updateHabit,
  deleteHabit,
} from "../../services/habitService";
import { Calendar } from "./Calendar";
import { createDate, formatDay, getToday, isSameDay } from "../../utils/date";
import {
  formatGoodShare,
  formatWeekProgress,
  pluralize,
} from "../../utils/string";
import { useNavigate, useParams } from "react-router-dom";
import { EditableTextField } from "./EditableTextField";
import "./StreakTracker.css";
import { StreakStat } from "./StreakStat";
import { ProgressBar } from "./ProgressBar";
import { HABIT_STATUS, STREAK_ICONS } from "../../shared/constants";
import { BottomSheet } from "./BottomSheet";
import { useAppBarContext } from "../AppBar/AppBar.Context";
import { StreakStatusRadioGroup } from "../StreakStatusRadioGroup/StreakStatusRadioGroup";
import { ConfirmDialog } from "../ConfirmDialog/ConfirmDialog";
import { GoalSelect } from "./GoalSelect";
import { getInsights } from "../../domain/insights";
import { YearOverview } from "./YearOverview";

type Status = (typeof HABIT_STATUS)[keyof typeof HABIT_STATUS];

interface Confirmation {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
}

const formatSheetDay = (date: Date) =>
  formatDay(date, { weekday: "long", day: "numeric", month: "long" });

export const StreakTracker = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [habit, setHabit] = useState<Habit>();
  const [loadError, setLoadError] = useState<"notFound" | "failed">();
  const [activeDate, setActiveDate] = useState<Date | undefined>();
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const { renderAppBarItems } = useAppBarContext();

  useEffect(
    function fetchAndSetHabit() {
      const fetchHabit = async (id: string) => {
        try {
          const data = await getHabitById(id);
          setHabit(data);
          setLoadError(data ? undefined : "notFound");
        } catch (error) {
          console.error("Could not fetch habit", { error });
          // The rules answer permission-denied for other users' and deleted habits.
          const isDenied = (error as { code?: string } | undefined)?.code === "permission-denied";
          setLoadError(isDenied ? "notFound" : "failed");
        }
      };

      if (id) fetchHabit(id);
    },
    [id],
  );

  const habitId = habit?.id;
  const habitName = habit?.name;

  useEffect(
    function renderDeleteOptionInAppBar() {
      if (!habitId) {
        return;
      }

      const id = habitId;

      async function onDelete() {
        try {
          await deleteHabit(id);
          navigate("/");
        } catch (error) {
          console.error("Could not delete habit...", { error });
        }
      }

      renderAppBarItems(
        <button
          type="button"
          className="error"
          onClick={() =>
            setConfirmation({
              title: "Delete habit?",
              body: `“${habitName}” and its whole history will be removed.`,
              confirmLabel: "Delete",
              onConfirm: onDelete,
            })
          }
        >
          Delete
        </button>,
      );
    },
    [habitId, habitName, renderAppBarItems, navigate],
  );

  // Only recompute when the habit changes, not when the sheet or a dialog opens.
  const insights = useMemo(() => (habit ? getInsights(habit) : []), [habit]);

  if (loadError) {
    return (
      <div className="page page-center StreakTracker-notFound">
        <p>
          {loadError === "notFound"
            ? "This habit doesn't exist, or it isn't yours."
            : "Couldn't load this habit. Check your connection and try again."}
        </p>
        <button type="button" onClick={() => navigate("/")}>
          Back to your habits
        </button>
      </div>
    );
  }

  if (!habit) {
    return null;
  }

  async function onUpdateName(name: string) {
    if (!habit) return;
    try {
      await updateHabit(habit.id, { name });
      setHabit((prev) => (prev ? { ...prev, name } : prev));
    } catch (error) {
      console.error("Could not update habit name", { error });
    }
  }

  async function onUpdateDescription(description: string) {
    if (!habit) return;
    try {
      await updateHabit(habit.id, { description });
      setHabit((prev) => (prev ? { ...prev, description } : prev));
    } catch (error) {
      console.error("Could not update habit description", { error });
    }
  }

  async function onUpdateGoal(goal: Goal) {
    if (!habit) return;
    const previousGoal = habit.goal;

    try {
      setHabit((prev) => prev && { ...prev, goal });
      await updateHabit(habit.id, { goal });
    } catch (error) {
      console.error("Could not update habit goal", { error });
      // Only undo our own goal: days marked meanwhile and newer goals stay.
      setHabit((prev) =>
        prev && prev.goal === goal ? { ...prev, goal: previousGoal } : prev,
      );
    }
  }

  async function saveDay(date: Date, status: Status, notes: string) {
    if (!habit) return;
    const previousHabit = habit;
    const updatedHabit = markDay(habit, date, status, notes);

    try {
      setHabit(updatedHabit);
      await updateHabit(habit.id, { streak: updatedHabit.streak });
    } catch (error) {
      console.error("Could not update habit", { error });
      setHabit(previousHabit);
    }
  }

  function handleUpdateDay(date: Date, status: Status, notes: string) {
    const notesWillBeLost = notes && status === HABIT_STATUS.NOT_SPECIFIED;

    if (!notesWillBeLost) {
      saveDay(date, status, notes);
      return;
    }

    setConfirmation({
      title: "Remove status?",
      body: `The note for this day will be deleted too: “${notes}”`,
      confirmLabel: "Remove",
      onConfirm: () => saveDay(date, status, notes),
    });
  }

  const findDay = (date: Date) =>
    habit.streak.find((s) => isSameDay(createDate(s.date), createDate(date)));

  const activeStreakDay = activeDate ? findDay(activeDate) : undefined;
  const { goal } = habit;
  const goodDays = getGoodDays(habit).length;
  const badDays = getBadDays(habit).length;
  const goodDaysThisWeek = countGoodDaysInWeek(habit, getToday());
  const streak = getStreakSummary(habit);
  const hint =
    goal.type === "weekly"
      ? goodDaysThisWeek < goal.times &&
        `${goal.times - goodDaysThisWeek} more to reach this week's goal.`
      : !findDay(getToday()) && "Today isn't marked yet. Tap today to log it.";

  return (
    <div className="page StreakTracker">
      <div className="StreakTracker-info">
        <EditableTextField
          value={habit.name}
          type="text"
          onUpdate={onUpdateName}
          allowEmpty={false}
          maxLength={200}
        />
        <EditableTextField
          value={habit.description}
          type="textarea"
          onUpdate={onUpdateDescription}
          placeholder="Add a description"
          maxLength={2000}
        />
        <GoalSelect goal={goal} onChange={onUpdateGoal} />
      </div>

      <div className="StreakTracker-stats">
        <StreakStat
          icon={STREAK_ICONS.CURRENT}
          label="Current"
          value={streak.current}
          unit={pluralize(streak.current, `${streak.unit} in a row`, `${streak.unit}s in a row`)}
        />
        <StreakStat
          icon={STREAK_ICONS.LONGEST}
          label="Longest"
          value={streak.longest}
          unit={pluralize(streak.longest, `${streak.unit}, best chain`, `${streak.unit}s, best chain`)}
        />
        <div className="StreakTracker-share">
          <div className="StreakTracker-share_header">
            <span className="StreakTracker-share_label">
              {goal.type === "weekly"
                ? formatWeekProgress(goodDaysThisWeek, goal.times)
                : formatGoodShare(goodDays, badDays)}
            </span>
            <span className="StreakTracker-share_counts">
              {goal.type === "weekly"
                ? `${goodDays} good days in total`
                : `${goodDays} good · ${badDays} bad`}
            </span>
          </div>
          {goal.type === "weekly" ? (
            <ProgressBar
              goodDays={Math.min(goodDaysThisWeek, goal.times)}
              badDays={0}
              total={goal.times}
              thick
            />
          ) : (
            <ProgressBar goodDays={goodDays} badDays={badDays} thick />
          )}
        </div>
      </div>

      <Calendar
        onSelectDate={setActiveDate}
        streak={habit.streak}
        goal={goal}
        onUpdateDate={(args) =>
          handleUpdateDay(args.date, args.status, args.notes)
        }
      />

      {/* Below the calendar on purpose: toggling it above would shift the
          grid under the user's finger and turn the next tap into a month change. */}
      {hint ? <div className="StreakTracker-hint">{hint}</div> : null}

      <YearOverview streak={habit.streak} />

      {insights.length > 0 ? (
        <section className="StreakTracker-insights" aria-labelledby="insights-title">
          <h3 id="insights-title">Patterns</h3>
          <ul>
            {insights.map((insight) => (
              <li key={insight}>{insight}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {activeDate ? (
        <BottomSheet onClose={() => setActiveDate(undefined)}>
          {(close) => (
            <div className="StreakTracker-sheet">
              <div className="StreakTracker-sheet_heading">
                <span className="StreakTracker-sheet_habit">{habit.name}</span>
                <h3>{formatSheetDay(activeDate)}</h3>
              </div>

              <div className="radio-group">
                <StreakStatusRadioGroup
                  verbose
                  allowBad={goal.type === "daily"}
                  currentStreakDay={
                    activeStreakDay ?? {
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

              <label className="StreakTracker-sheet_note">
                <span>Note</span>
                <EditableTextField
                  key={activeStreakDay?.date?.toISOString()}
                  type="textarea"
                  placeholder={
                    activeStreakDay
                      ? "e.g. Ran 5 km"
                      : goal.type === "daily"
                        ? "Mark the day ✓ or ✗ to add a note"
                        : "Mark the day ✓ to add a note"
                  }
                  value={activeStreakDay?.notes ?? ""}
                  onUpdate={(notes) =>
                    activeStreakDay &&
                    handleUpdateDay(
                      activeStreakDay.date,
                      activeStreakDay.status,
                      notes,
                    )
                  }
                  disabled={!activeStreakDay}
                />
              </label>

              <button type="button" onClick={close}>
                Done
              </button>
            </div>
          )}
        </BottomSheet>
      ) : null}

      {confirmation ? (
        <ConfirmDialog
          {...confirmation}
          onCancel={() => setConfirmation(undefined)}
          onConfirm={() => {
            setConfirmation(undefined);
            confirmation.onConfirm();
          }}
        />
      ) : null}
    </div>
  );
};
