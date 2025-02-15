import "./Habits.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Habit } from "../../shared/Habit";
import { addHabit, getAllHabits } from "../../services/habitService";
import { ProgressBar } from "../StreakTracker/ProgressBar";
import { StreakStat } from "../StreakTracker/StreakStat";
import { findStreaks } from "../../shared/findStreaks";

export const Habits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHabits = async () => {
      const data = await getAllHabits();
      setHabits(data);
    };
    fetchHabits();
  }, []);

  async function onCreateHabit() {
    try {
      const habitId = await addHabit();
      navigate(`/habits/${habitId}`);
    } catch (error) {
      console.log({ error });
    }
  }

  function navigateToDetailView(id: Habit["id"]) {
    return () => navigate(`/habits/${id}`);
  }

  return (
    <div className="page">
      <h1>Habits</h1>
      {habits.map(({ id, name, streak }) => {
        console.log({ streak });
        const { longestStreak, currentStreak } = findStreaks(streak ?? []);
        console.log({ longestStreak, currentStreak });
        return (
          <div
            className="habit-item"
            key={id}
            onClick={navigateToDetailView(id)}
          >
            <span className="habit-item_title">{name}</span>
            <div className="habit-item_row">
              <ProgressBar
                goodDays={streak.filter((s) => s.status === "GOOD").length}
                badDays={streak.filter((s) => s.status === "BAD").length}
              />
            </div>
            <div className="habit-item_row">
              <StreakStat
                icon="🔥"
                label="Longest"
                value={longestStreak.streak}
                unit={longestStreak.streak === 1 ? "day" : "days"}
                compact
              />
              <StreakStat
                icon="🔄"
                label="Current"
                value={currentStreak.streak}
                unit={currentStreak.streak === 1 ? "day" : "days"}
                compact
              />
            </div>
          </div>
        );
      })}
      <button type="button" onClick={onCreateHabit}>
        Create habit
      </button>
    </div>
  );
};
