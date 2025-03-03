import "./HabitsList.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Habit } from "../../shared/Habit";
import { addHabit, getAllHabits } from "../../services/habitService";
import { ProgressBar } from "../StreakTracker/ProgressBar";
import { StreakStat } from "../StreakTracker/StreakStat";
import { findStreaks } from "../../shared/findStreaks";
import { LOG } from "../../utils/logger";
import { isSameDay } from "../../utils/date";
import { useAppBarContext } from "../AppBar/AppBar.Context";

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
        const hasNotMadeSelectionForToday = !streak.find((s) =>
          isSameDay(s.date, new Date()),
        );

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
              {hasNotMadeSelectionForToday ? (
                <i>{messages[getRandomInteger(messages.length)]}</i>
              ) : null}
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
