import "./YearOverview.css";
import { memo, useEffect, useMemo, useRef } from "react";
import type { StreakDay } from "../../domain/Habit";
import { buildYearOverview } from "../../domain/yearOverview";
import { formatDay, getToday, isSameDay } from "../../utils/date";
import { pluralize } from "../../utils/string";

const classNameByStatus = {
  GOOD: "YearOverview-day_success",
  BAD: "YearOverview-day_error",
  NOT_SPECIFIED: "",
};

const statusLabel = { GOOD: "✓", BAD: "✗", NOT_SPECIFIED: "not marked" };

// Memoized: 371 formatted cells shouldn't re-render when the sheet or a dialog opens.
export const YearOverview = memo(function YearOverview({ streak }: Props) {
  const { weeks, monthLabels, goodDays } = useMemo(
    () => buildYearOverview(streak),
    [streak],
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = getToday();

  useEffect(function startAtToday() {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const goodDaysLabel = `${goodDays} good ${pluralize(goodDays, "day")}`;

  return (
    <section className="YearOverview" aria-labelledby="year-overview-title">
      <div className="YearOverview-header">
        <h3 id="year-overview-title">Last 12 months</h3>
        <span>{goodDaysLabel}</span>
      </div>

      <div className="YearOverview-scroll" ref={scrollRef}>
        <div className="YearOverview-months" aria-hidden="true">
          {monthLabels.map((month, week) => (
            <span key={week}>{month ? formatDay(month, { month: "short" }) : ""}</span>
          ))}
        </div>
        <div className="YearOverview-grid" role="img" aria-label={`${goodDaysLabel} in the last 12 months`}>
          {weeks.flatMap((week, weekNumber) =>
            week.map((cell, weekday) =>
              cell ? (
                <span
                  key={`${weekNumber}-${weekday}`}
                  className={`YearOverview-day ${classNameByStatus[cell.status]} ${isSameDay(cell.date, today) ? "YearOverview-day_today" : ""}`}
                  title={`${formatDay(cell.date, { weekday: "short", day: "numeric", month: "short" })}: ${statusLabel[cell.status]}`}
                />
              ) : (
                <span key={`${weekNumber}-${weekday}`} />
              ),
            ),
          )}
        </div>
      </div>
    </section>
  );
});

interface Props {
  streak: StreakDay[];
}
