import { addDoc, collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import type { Habit } from "../../shared/Habit";

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

const getAllHabits = async (): Promise<Habit[]> => {
  const habitsRef = collection(db, "habits");
  const snapshot = await getDocs(habitsRef);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as unknown as Habit[];
};

const addHabit = async () => {
  const habitsRef = collection(db, "habits");
  const docRef = await addDoc(habitsRef, {
    name: `Habit ${new Date().toISOString()}`,
    description: "",
    streak: [],
    createdAt: Date.now(),
  });

  return docRef.id;
};
