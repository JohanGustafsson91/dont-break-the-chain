import "./HabitsList.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DayInStreak, Habit } from "../../shared/Habit";
import {
  addHabit,
  getAllHabits,
  updateHabit,
} from "../../services/habitService";
import { ProgressBar } from "../StreakTracker/ProgressBar";
import { StreakStat } from "../StreakTracker/StreakStat";
import { findStreaks } from "../../shared/findStreaks";

import { createDate, isSameDay } from "../../utils/date";
import { useAppBarContext } from "../AppBar/AppBar.Context";
import { StreakStatusRadioGroup } from "../StreakStatusRadioGroup/StreakStatusRadioGroup";
import {
  getUpdatedStreak,
  GetUpdatedStreak,
} from "../../shared/getUpdatedStreak";

const motivationalMessages = {
  GOOD: [
    "Great job! Every step counts toward your goal! 🚀",
    "Consistency is key—you're building something amazing! 🔥",
    "Another day, another win! Keep up the great work! 💪",
    "You're on fire! 🔥 Keep the streak alive!",
    "Your future self is thanking you right now. Keep going! 😊",
    "Success is built one day at a time. You're doing awesome! 🎯",
    "Momentum is on your side! Keep pushing forward! 🚀",
    "That's another brick in the wall of success! Keep stacking! 🏗️",
    "Discipline > Motivation. And you've got it! 💯",
    "You're proving to yourself that you can do this! Keep it up! 💪",
  ],
  BAD: [
    "It's okay—every day is a new chance to start fresh. 🌱",
    "Missed a day? No worries! Just get back on track tomorrow. 😊",
    "One setback doesn't define your progress. Keep going! 💪",
    "Chains get stronger by overcoming breaks—don't give up! 🔗",
    "Progress isn't perfect. What matters is showing up again! 🔄",
    "Failure is just a stepping stone to success. Keep at it! 🚀",
    "Even a broken chain can be mended. Restart today! 🔄",
    "Missed a day? Learn from it and push forward! 💡",
    "Momentum can be rebuilt. Just take the next step! 👣",
    "You haven't failed until you stop trying. Get back up! 💪",
  ],
  NOT_SPECIFIED: [
    "Keep the streak alive! Mark your progress for today.",
    "No entry for today yet—tap to stay on track!",
    "Your chain is waiting! Log today's progress.",
    "Don't let the streak end—check in for today!",
    "One small action today keeps the momentum going!",
  ],
} as const;

const itemClassByDayStatus = {
  GOOD: "HabitsList-item_success",
  BAD: "HabitsList-item_bad",
  NOT_SPECIFIED: "",
};

const getRandomInteger = (max: number) => {
  return Math.floor(Math.random() * max);
};

export const HabitsList = () => {
  const [habits, setHabits] = useState<State>({ data: [], status: "pending" });
  const navigate = useNavigate();
  const { renderAppBarItems } = useAppBarContext();

  useEffect(
    function renderCreateHabitOptionInAppBar() {
      async function onCreateHabit() {
        try {
          const habitId = await addHabit();
          navigate(`/habits/${habitId}`);
        } catch (error) {
          console.error("Could not create habit", { error });
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
        setHabits({ data, status: "resolved" });
      } catch (error) {
        console.error("Could fetch habits", { error });
        setHabits({ data: [], status: "rejected" });
      }
    })();
  }, []);

  function navigateToDetailView(id: Habit["id"]) {
    return navigate(`/habits/${id}`);
  }

  async function handleUpdateStreak(args: GetUpdatedStreak) {
    const { habit } = args;

    if (!habit) {
      return;
    }

    const { streak, previousStreak } = getUpdatedStreak(args);

    const updateStateFn = (streak: DayInStreak[]) => (prev: State) =>
      prev.data.map((prevHabit) =>
        prevHabit.id === habit.id ? { ...prevHabit, streak } : prevHabit,
      );

    try {
      setHabits((prev) => ({ ...prev, data: updateStateFn(streak)(prev) }));
      await updateHabit(habit.id, { streak });
    } catch (error) {
      console.error("Could not update habit", { error });
      setHabits((prev) => ({
        ...prev,
        data: updateStateFn(previousStreak)(prev),
      }));
    }
  }

  return (
    <div className="page">
      <h1>Habits</h1>

      {
        {
          resolved: habits.data.map((habit) => {
            const { id, name, streak } = habit;
            const { longestStreak, currentStreak } = findStreaks(streak ?? []);
            const today = createDate(new Date());
            const currentStreakDay = streak.find((s) =>
              isSameDay(s.date, today),
            );
            const currentDayStatus =
              currentStreakDay?.status ?? "NOT_SPECIFIED";

            return (
              <div
                className={`HabitsList-item ${itemClassByDayStatus[currentDayStatus]}`}
                key={id}
                onClick={(e) => {
                  if ((e.target as HTMLElement).matches(".radio-custom")) {
                    return;
                  }

                  navigateToDetailView(id);
                }}
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
                    <i>
                      {
                        motivationalMessages[currentDayStatus][
                          getRandomInteger(motivationalMessages[currentDayStatus].length)
                        ]
                      }
                    </i>
                  </span>
                </div>

                <div className="radio-group form-element">
                  <StreakStatusRadioGroup
                    currentStreakDay={
                      currentStreakDay ?? {
                        status: "NOT_SPECIFIED",
                        date: today,
                        notes: "",
                      }
                    }
                    onUpdateStatus={(values) =>
                      handleUpdateStreak({ ...values, habit })
                    }
                  />
                </div>
              </div>
            );
          }),
          pending: <p className="loading">Fetching habits</p>,
          rejected: <p>Could not fetch habits...</p>,
        }[habits.status]
      }
    </div>
  );
};

interface State {
  data: Habit[];
  status: "pending" | "resolved" | "rejected";
}
