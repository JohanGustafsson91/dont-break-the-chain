import "./HabitsList.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Habit } from "../../domain/Habit";
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  getGoodDays,
  getBadDays,
  markDay,
} from "../../domain/Habit";
import {
  addHabit,
  getAllHabits,
  updateHabit,
} from "../../services/habitService";
import { ProgressBar } from "../StreakTracker/ProgressBar";
import { StreakStat } from "../StreakTracker/StreakStat";
import { HABIT_STATUS, STREAK_ICONS } from "../../shared/constants";
import { createDate } from "../../utils/date";
import { pluralize } from "../../utils/string";
import { useAppBarContext } from "../AppBar/AppBar.Context";
import { StreakStatusRadioGroup } from "../StreakStatusRadioGroup/StreakStatusRadioGroup";

const motivationalMessages = {
  [HABIT_STATUS.GOOD]: [
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
  [HABIT_STATUS.BAD]: [
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
  [HABIT_STATUS.NOT_SPECIFIED]: [
    "Keep the streak alive! Mark your progress for today.",
    "No entry for today yet—tap to stay on track!",
    "Your chain is waiting! Log today's progress.",
    "Don't let the streak end—check in for today!",
    "One small action today keeps the momentum going!",
  ],
} as const;

const itemClassByDayStatus = {
  [HABIT_STATUS.GOOD]: "HabitsList-item_success",
  [HABIT_STATUS.BAD]: "HabitsList-item_bad",
  [HABIT_STATUS.NOT_SPECIFIED]: "",
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

  async function handleUpdateDay(
    habit: Habit,
    date: Date,
    status: typeof HABIT_STATUS[keyof typeof HABIT_STATUS],
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
      // Rollback
      setHabits((prev) => ({
        ...prev,
        data: prev.data.map((h) => (h.id === habit.id ? previousHabit : h)),
      }));
    }
  }

  return (
    <div className="page">
      <h1>Habits</h1>

      {
        {
          resolved: habits.data.map((habit) => {
            const { id, name } = habit;
            const currentStreakData = calculateCurrentStreak(habit);
            const longestStreakData = calculateLongestStreak(habit);
            const today = createDate(new Date());
            
            const currentStreakDay = habit.streak.find((s) => {
              const sDate = createDate(s.date);
              return sDate.getTime() === today.getTime();
            });
            
            const currentDayStatus =
              currentStreakDay?.status ?? HABIT_STATUS.NOT_SPECIFIED;

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
                    goodDays={getGoodDays(habit).length}
                    badDays={getBadDays(habit).length}
                  />
                </div>
                <div className="HabitsList-item_row">
                  <StreakStat
                    icon={STREAK_ICONS.CURRENT}
                    label="Current"
                    value={currentStreakData.count}
                    unit={pluralize(currentStreakData.count, "day")}
                    compact
                  />
                  <StreakStat
                    icon={STREAK_ICONS.LONGEST}
                    label="Longest"
                    value={longestStreakData.count}
                    unit={pluralize(longestStreakData.count, "day")}
                    compact
                  />
                </div>

                <div className="HabitsList-item_row">
                  <span className="HabitsList-status-text">
                    <i>
                      {
                        motivationalMessages[currentDayStatus][
                          getRandomInteger(
                            motivationalMessages[currentDayStatus].length,
                          )
                        ]
                      }
                    </i>
                  </span>
                </div>

                <div className="radio-group form-element">
                  <StreakStatusRadioGroup
                    currentStreakDay={
                      currentStreakDay ?? {
                        status: HABIT_STATUS.NOT_SPECIFIED,
                        date: today,
                        notes: "",
                      }
                    }
                    onUpdateStatus={(values) =>
                      handleUpdateDay(habit, values.date, values.status, currentStreakDay?.notes ?? "")
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
