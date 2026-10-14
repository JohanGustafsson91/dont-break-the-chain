import { formatGoodShare, formatWeekProgress } from "../../utils/string";
import { useEffect, useMemo, useState } from "react";
import type { Goal, Habit } from "../../domain/Habit";
import {
  countGoodDaysInWeek,
  getGoodDays,
  getBadDays,
  getStreakSummary,
  markDay,
  startOfWeek,
} from "../../domain/Habit";
import {
  getHabitById,
  updateHabit,
  deleteHabit,
} from "../../services/habitService";
import { Calendar } from "./Calendar";
import { createDate, formatDay, getToday, isSameDay } from "../../utils/date";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { EditableTextField } from "./EditableTextField";
import "./StreakTracker.css";
import { StreakStat } from "./StreakStat";
import { ProgressBar } from "./ProgressBar";
import { HABIT_STATUS, STREAK_ICONS } from "../../shared/constants";
import { BottomSheet } from "./BottomSheet";
import { useAppBarContext } from "../AppBar/AppBar.Context";
import { refreshTodayProgress } from "../../services/reminderService";
import { StreakStatusRadioGroup } from "../StreakStatusRadioGroup/StreakStatusRadioGroup";
import { ConfirmDialog } from "../ConfirmDialog/ConfirmDialog";
import { useToast } from "../Toast/Toast.Context";
import { GoalSelect } from "./GoalSelect";
import { getInsights } from "../../domain/insights";
import { YearOverview } from "./YearOverview";
import { useLanguage, useMessages } from "../../i18n/i18n";
import { streakTrackerMessages } from "./messages";

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
  const location = useLocation();
  // Read once: the flag lives in the history entry, and is cleared below so a
  // reload or Back doesn't select the name again.
  const [isNewHabit] = useState(location.state?.isNewHabit === true);

  useEffect(
    function forgetNewHabitFlag() {
      if (location.state?.isNewHabit) {
        navigate(location.pathname, { replace: true, state: null });
      }
    },
    [location, navigate],
  );
  const [habit, setHabit] = useState<Habit>();
  const [loadError, setLoadError] = useState<"notFound" | "failed">();
  const [activeDate, setActiveDate] = useState<Date | undefined>();
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const { renderAppBarItems } = useAppBarContext();
  const { showToast } = useToast();
  const { language } = useLanguage();
  const m = useMessages(streakTrackerMessages);

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
          showToast(m.deleteFailed);
        }
      }

      renderAppBarItems(
        <button
          type="button"
          className="error"
          onClick={() =>
            setConfirmation({
              title: m.deleteTitle,
              body: m.deleteBody(habitName ?? ""),
              confirmLabel: m.delete,
              onConfirm: onDelete,
            })
          }
        >
          {m.delete}
        </button>,
      );
    },
    [habitId, habitName, renderAppBarItems, navigate, showToast, m],
  );

  // Only recompute when the habit or language changes, not when the sheet or a dialog opens.
  const insights = useMemo(
    () => (habit ? getInsights(habit) : []),
    // getInsights reads the active language itself, so it's a real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [habit, language],
  );

  if (loadError) {
    return (
      <div className="page page-center StreakTracker-notFound">
        <p>
          {loadError === "notFound"
            ? m.notFound
            : m.loadFailed}
        </p>
        <button type="button" onClick={() => navigate("/")}>
          {m.backToHabits}
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
      showToast(m.saveNameFailed);
    }
  }

  async function onUpdateDescription(description: string) {
    if (!habit) return;
    try {
      await updateHabit(habit.id, { description });
      setHabit((prev) => (prev ? { ...prev, description } : prev));
    } catch (error) {
      console.error("Could not update habit description", { error });
      showToast(m.saveDescriptionFailed);
    }
  }

  async function onUpdateGoal(goal: Goal) {
    if (!habit) return;
    const previousGoal = habit.goal;

    try {
      setHabit((prev) => prev && { ...prev, goal });
      await updateHabit(habit.id, { goal });
      // A daily habit needs today marked; a weekly one may not.
      void refreshTodayProgress();
    } catch (error) {
      console.error("Could not update habit goal", { error });
      showToast(m.saveGoalFailed);
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
      // Today's mark, or any day this week for a weekly goal, can change what's left today.
      const affectsToday =
        isSameDay(createDate(date), getToday()) ||
        (habit.goal.type === "weekly" &&
          startOfWeek(date).getTime() === startOfWeek(getToday()).getTime());
      if (affectsToday) void refreshTodayProgress();
    } catch (error) {
      console.error("Could not update habit", { error });
      showToast(m.saveDayFailed);
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
      title: m.removeStatusTitle,
      body: m.removeStatusBody(notes),
      confirmLabel: m.remove,
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
        m.weeklyHint(goal.times - goodDaysThisWeek)
      : !findDay(getToday()) && m.dailyHint;

  return (
    <div className="page StreakTracker">
      <div className="StreakTracker-summary">
        <div className="StreakTracker-info">
          <EditableTextField
            value={habit.name}
            type="text"
            onUpdate={onUpdateName}
            allowEmpty={false}
            maxLength={200}
            selectOnMount={isNewHabit}
          />
          <EditableTextField
            value={habit.description}
            type="textarea"
            onUpdate={onUpdateDescription}
            placeholder={m.descriptionPlaceholder}
            maxLength={2000}
          />
          <GoalSelect goal={goal} onChange={onUpdateGoal} />
        </div>

        <div className="StreakTracker-stats">
          <StreakStat
            icon={STREAK_ICONS.CURRENT}
            label={m.current}
            value={streak.current}
            unit={m.currentUnit(streak.current, streak.unit)}
          />
          <StreakStat
            icon={STREAK_ICONS.LONGEST}
            label={m.longest}
            value={streak.longest}
            unit={m.longestUnit(streak.longest, streak.unit)}
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
                  ? m.goodDaysInTotal(goodDays)
                  : m.goodAndBad(goodDays, badDays)}
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
      </div>

      <div className="StreakTracker-calendar">
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
      </div>

      <YearOverview streak={habit.streak} />

      {insights.length > 0 ? (
        <section className="StreakTracker-insights" aria-labelledby="insights-title">
          <h3 id="insights-title">{m.patterns}</h3>
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
                  allowRest
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
                <span>{m.note}</span>
                <EditableTextField
                  key={activeStreakDay?.date?.toISOString()}
                  type="textarea"
                  placeholder={
                    activeStreakDay
                      ? m.notePlaceholder
                      : goal.type === "daily"
                        ? m.markToAddNoteDaily
                        : m.markToAddNoteWeekly
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
                {m.done}
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
