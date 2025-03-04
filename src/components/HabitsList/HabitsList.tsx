import "./HabitsList.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Habit } from "../../shared/Habit";
import { addHabit, getAllHabits } from "../../services/habitService";
import { ProgressBar } from "../StreakTracker/ProgressBar";
import { StreakStat } from "../StreakTracker/StreakStat";
import { findStreaks } from "../../shared/findStreaks";
import { LOG } from "../../utils/logger";
import { createDate, isSameDay } from "../../utils/date";
import { useAppBarContext } from "../AppBar/AppBar.Context";
import { textByStatus } from "../../shared/textByStatus";
import { Status } from "../../shared/Status";

export const HabitsList = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const navigate = useNavigate();
  const { renderAppBarItems } = useAppBarContext();

  useEffect(
    function renderCreateHabitOptionInAppBar() {
      async function onCreateHabit() {
        try {
          const habitId = await addHabit();
          navigate(`/habits/${habitId}`);
        } catch (error) {
          LOG.error("Could not create habit", { error });
        }
      }

      renderAppBarItems(
        <button type="button" onClick={onCreateHabit}>
          Create habit
        </button>,
      );
    },
    [navigate, renderAppBarItems],
  );

  useEffect(function fetchAndSetHabits() {
    (async () => {
      try {
        const data = await getAllHabits();
        setHabits(data);
      } catch (error) {
        LOG.error("Could fetch habits", { error });
      }
    })();
  }, []);

  function navigateToDetailView(id: Habit["id"]) {
    return () => navigate(`/habits/${id}`);
  }

  return (
    <div className="page">
      <h1>Habits</h1>

      {habits.map(({ id, name, streak }) => {
        const { longestStreak, currentStreak } = findStreaks(streak ?? []);
        const currentStreakDay = streak.find((s) =>
          isSameDay(s.date, createDate(new Date())),
        );
        const hasNotMadeSelectionForToday = !currentStreakDay;
        console.log({ streakForToday: currentStreakDay });

        return (
          <div
            className="HabitsList-item"
            key={id}
            onClick={navigateToDetailView(id)}
          >
            <span className="HabitsList-item_title">{name}</span>
            <div className="HabitsList-item_row">
              <ProgressBar
                goodDays={streak.filter((s) => s.status === "GOOD").length}
                badDays={streak.filter((s) => s.status === "BAD").length}
              />
            </div>
            <div className="HabitsList-item_row">
              <StreakStat
                icon="🔄"
                label="Current"
                value={currentStreak.streak}
                unit={currentStreak.streak === 1 ? "day" : "days"}
                compact
              />
              <StreakStat
                icon="🔥"
                label="Longest"
                value={longestStreak.streak}
                unit={longestStreak.streak === 1 ? "day" : "days"}
                compact
              />
            </div>

            <div className="HabitsList-item_row">
              <span className="HabitsList-status-text">
                {hasNotMadeSelectionForToday ? (
                  <i>{messages[getRandomInteger(messages.length)]}</i>
                ) : null}
              </span>
            </div>

            <div className="radio-group form-element">
              {["GOOD", "BAD", "NOT_SPECIFIED"].map((status) => {
                const checked = Boolean(
                  (currentStreakDay?.status ?? "NOT_SPECIFIED") === status,
                );

                console.log({
                  name,
                  checked,
                  status,
                  currentStreakDay: currentStreakDay?.date,
                });
                return (
                  <label className="radio-label" key={status}>
                    <input
                      type="radio"
                      name="options"
                      className={`radio-input ${checked ? "radio-input_checked" : ""}`}
                      value={status}
                      disabled
                      checked={Boolean(
                        (currentStreakDay?.status ?? "NOT_SPECIFIED") ===
                          status,
                      )}
                    />
                    <span className="radio-custom"></span>
                    {textByStatus[status]}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const messages = [
  "Keep the streak alive! Mark your progress for today.",
  "No entry for today yet—tap to stay on track!",
  "Your chain is waiting! Log today’s progress.",
  "Don’t let the streak end—check in for today!",
  "One small action today keeps the momentum going!",
];

const getRandomInteger = (max: number) => {
  return Math.floor(Math.random() * max);
};
