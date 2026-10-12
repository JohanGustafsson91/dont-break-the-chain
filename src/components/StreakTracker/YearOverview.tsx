import "./YearOverview.css";
import { memo, useEffect, useMemo, useRef } from "react";
import type { StreakDay } from "../../domain/Habit";
import { buildYearOverview } from "../../domain/yearOverview";
import { formatDay, getToday, isSameDay } from "../../utils/date";
import { useMessages } from "../../i18n/i18n";
import { yearOverviewMessages } from "./messages";

const classNameByStatus = {
  GOOD: "YearOverview-day_success",
  BAD: "YearOverview-day_error",
  REST: "YearOverview-day_rest",
  NOT_SPECIFIED: "",
};

// Swedish abbreviates with a dot ("okt."); the labels are tighter without it.
const formatShortMonth = (date: Date) =>
  formatDay(date, { month: "short" }).replace(/\.$/, "");

// Memoized: 371 formatted cells shouldn't re-render when the sheet or a dialog opens.
export const YearOverview = memo(function YearOverview({ streak }: Props) {
  const { weeks, monthLabels, goodDays } = useMemo(
    () => buildYearOverview(streak),
    [streak],
  );
  const m = useMessages(yearOverviewMessages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = getToday();

  useEffect(function startAtToday() {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const goodDaysLabel = m.goodDays(goodDays);

  return (
    <section className="YearOverview" aria-labelledby="year-overview-title">
      <div className="YearOverview-header">
        <h3 id="year-overview-title">{m.title}</h3>
        <span>{goodDaysLabel}</span>
      </div>

      <div className="YearOverview-scroll" ref={scrollRef}>
        <div className="YearOverview-months" aria-hidden="true">
          {monthLabels.map((month, week) => (
            <span key={week}>{month ? formatShortMonth(month) : ""}</span>
          ))}
        </div>
        <div className="YearOverview-grid" role="img" aria-label={m.gridLabel(goodDaysLabel)}>
          {weeks.flatMap((week, weekNumber) =>
            week.map((cell, weekday) =>
              cell ? (
                <span
                  key={`${weekNumber}-${weekday}`}
                  className={`YearOverview-day ${classNameByStatus[cell.status]} ${isSameDay(cell.date, today) ? "YearOverview-day_today" : ""}`}
                  title={`${formatDay(cell.date, { weekday: "short", day: "numeric", month: "short" })}: ${m.status[cell.status]}`}
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
