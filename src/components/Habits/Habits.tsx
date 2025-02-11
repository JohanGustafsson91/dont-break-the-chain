import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Habit } from "../../shared/Habit";
import { addHabit, getAllHabits } from "../../services/habitService";

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

  return (
    <div className="page">
      <h1>Habits</h1>
      {habits.map(({ id, name }) => (
        <p key={id}>
          <Link to={`/habits/${id}`}>{name}</Link>
        </p>
      ))}
      <button type="button" onClick={onCreateHabit}>
        Create habit
      </button>
    </div>
  );
};
