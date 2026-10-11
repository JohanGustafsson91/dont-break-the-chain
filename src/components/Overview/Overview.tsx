import "./Overview.css";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { Habit } from "../../domain/Habit";
import { getStreakSummary } from "../../domain/Habit";
import { buildOverview, type OverviewCell, type OverviewRow, type OverviewWeeks } from "../../domain/overview";
import { getAllHabits } from "../../services/habitService";
import { HABIT_STATUS } from "../../shared/constants";
import { formatDay } from "../../utils/date";
import { ViewSwitch } from "../ViewSwitch/ViewSwitch";

const shortDate = (date: Date) => formatDay(date, { month: "short", day: "numeric" });
const weekdayLetter = (date: Date) => formatDay(date, { weekday: "narrow" });

const cellClass = (cell: OverviewCell, isWeekly: boolean) =>
  [
    "Overview-cell",
    cell.isBeforeStart && "Overview-cell_none",
    cell.isFuture && "Overview-cell_future",
    cell.isToday && "Overview-cell_today",
    cell.status === HABIT_STATUS.GOOD && (isWeekly ? "Overview-cell_good-weekly" : "Overview-cell_good"),
    cell.status === HABIT_STATUS.BAD && "Overview-cell_bad",
  ]
    .filter(Boolean)
    .join(" ");

const streakText = (habit: Habit) => {
  const { current, unit } = getStreakSummary(habit);
  if (current === 0) return "";
  return unit === "week" ? `${current} wk in a row` : `${current} in a row`;
};

/** What a screen reader hears for a row instead of every cell. */
const rowLabel = ({ habit, weeks, weekTotals }: OverviewRow) => {
  const cells = weeks.flat();
  const good = cells.filter((c) => c.status === HABIT_STATUS.GOOD).length;
  const bad = cells.filter((c) => c.status === HABIT_STATUS.BAD).length;
  const streak = streakText(habit);
  const goal = habit.goal;
  let summary = `${good} done, ${bad} missed`;
  if (goal.type === "weekly" && weekTotals) {
    // A week still under way isn't a miss yet; it only counts once its goal is met.
    const decided = weekTotals.filter(
      (n, w): n is number => n !== undefined && (n >= goal.times || !weeks[w].some((c) => c.isToday || c.isFuture)),
    );
    const met = decided.filter((n) => n >= goal.times).length;
    summary = `${good} done, weekly goal met ${met} of ${decided.length} weeks`;
  }
  return `${habit.name}: ${summary}${streak ? `, ${streak}` : ""}`;
};

export const Overview = () => {
  const [habits, setHabits] = useState<State>({ data: [], status: "pending" });
  // In the address, so coming back from a habit returns to the same period.
  const [params, setParams] = useSearchParams();
  const weekCount: OverviewWeeks = params.get("weeks") === "4" ? 4 : 2;
  const periodsBack = Math.max(0, Number.parseInt(params.get("back") ?? "", 10) || 0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(function fetchHabits() {
    (async () => {
      try {
        setHabits({ data: await getAllHabits(), status: "resolved" });
      } catch (error) {
        console.error("Could not fetch habits", { error });
        setHabits({ data: [], status: "rejected" });
      }
    })();
  }, []);

  const overview = buildOverview(habits.data, weekCount, periodsBack);
  const firstDay = overview.weeks[0][0];
  const lastDay = overview.weeks[overview.weeks.length - 1][6];
  const hasLater = periodsBack > 0;
  const hasWeekly = overview.rows.some((row) => row.habit.goal.type === "weekly");

  function show(weeks: OverviewWeeks, back: number) {
    const next = new URLSearchParams();
    if (weeks === 4) next.set("weeks", "4");
    if (back > 0) next.set("back", String(back));
    setParams(next, { replace: true });
  }

  const titleAlone = <h1 className="Overview-title Overview-title_alone">Overview</h1>;

  return (
    <div className={`page Overview Overview_weeks-${weekCount}`}>
      <ViewSwitch />

      {
        {
          pending: (
            <>
              {titleAlone}
              <p className="loading">Fetching habits</p>
            </>
          ),
          rejected: (
            <>
              {titleAlone}
              <p className="Overview-message" role="alert">
                Couldn't load your habits. Check your connection and reload the page.
              </p>
            </>
          ),
          resolved:
            habits.data.length === 0 ? (
              <>
                {titleAlone}
                <p className="Overview-message">
                  No habits yet. <Link to="/">Create one under Today</Link>.
                </p>
              </>
            ) : (
              <>
                {/* Read out when the period changes. */}
                <div className="Overview-range" aria-live="polite">
                  {shortDate(firstDay)} – {shortDate(lastDay)}
                </div>
                <div className="Overview-heading">
                  <h1 className="Overview-title">Overview</h1>
                  <div className="Overview-nav">
                    {/* aria-disabled, not disabled: disabling the pressed button would drop its focus. */}
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Earlier"
                      aria-disabled={!overview.hasEarlier}
                      onClick={() => overview.hasEarlier && show(weekCount, periodsBack + 1)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M15 6l-6 6 6 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Later"
                      aria-disabled={!hasLater}
                      onClick={() => hasLater && show(weekCount, periodsBack - 1)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M9 6l6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="Overview-span" role="group" aria-label="Period">
                  {([2, 4] as const).map((count) => (
                    <button
                      key={count}
                      type="button"
                      aria-pressed={weekCount === count}
                      onClick={() => show(count, 0)}
                    >
                      {count} weeks
                    </button>
                  ))}
                </div>

                {overview.counted > 0 ? (
                  <p className="Overview-summary">
                    Daily habits:{" "}
                    <b>
                      {overview.done} of {overview.counted}
                    </b>{" "}
                    days done ({Math.round((overview.done / overview.counted) * 100)} %)
                  </p>
                ) : null}

                <div className="Overview-days" aria-hidden="true">
                  {overview.weeks.map((week) => (
                    <div className="Overview-week" key={week[0].getTime()}>
                      {weekCount === 2 ? (
                        week.map((date) => (
                          <span key={date.getTime()} className="Overview-day">
                            <span>{weekdayLetter(date)}</span>
                            <span>{date.getUTCDate()}</span>
                          </span>
                        ))
                      ) : (
                        <span className="Overview-weekLabel">{shortDate(week[0])}</span>
                      )}
                    </div>
                  ))}
                </div>

                <ul className="Overview-rows">
                  {overview.rows.map((row) => {
                    const { habit, weeks, weekTotals } = row;
                    const goal = habit.goal;
                    return (
                      <li key={habit.id}>
                        <button
                          type="button"
                          className="Overview-row"
                          aria-label={rowLabel(row)}
                          onClick={() =>
                            navigate(`/habits/${habit.id}`, { state: { from: `/overview${location.search}` } })
                          }
                        >
                          <span className="Overview-rowHeader">
                            <span className="Overview-name">{habit.name}</span>
                            <span className="Overview-streak">{streakText(habit)}</span>
                          </span>
                          <span className="Overview-cells">
                            {weeks.map((week, w) => (
                              <span className="Overview-week" key={w}>
                                {week.map((cell) => (
                                  <span key={cell.date.getTime()} className={cellClass(cell, goal.type === "weekly")} />
                                ))}
                              </span>
                            ))}
                          </span>
                          {goal.type === "weekly" && weekTotals ? (
                            <span className="Overview-cells">
                              {weekTotals.map((n, w) =>
                                n === undefined ? (
                                  <span key={w} className="Overview-weekTotal Overview-weekTotal_none" />
                                ) : (
                                  <span
                                    key={w}
                                    className={`Overview-weekTotal${n >= goal.times ? " Overview-weekTotal_met" : ""}`}
                                  >
                                    {n}/{goal.times}
                                    {n >= goal.times ? " ✓" : ""}
                                  </span>
                                ),
                              )}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="Overview-legend" aria-hidden="true">
                  <span><span className="Overview-cell Overview-cell_good" /> Done</span>
                  {hasWeekly ? (
                    <span><span className="Overview-cell Overview-cell_good-weekly" /> Done, weekly goal</span>
                  ) : null}
                  <span><span className="Overview-cell Overview-cell_bad" /> Missed</span>
                  <span><span className="Overview-cell" /> Not marked</span>
                </div>
              </>
            ),
        }[habits.status]
      }
    </div>
  );
};

interface State {
  data: Habit[];
  status: "pending" | "resolved" | "rejected";
}
