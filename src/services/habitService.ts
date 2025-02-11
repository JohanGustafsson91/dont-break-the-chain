import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import type { DayInStreak, Habit } from "../shared/Habit";
import { db } from "./firebaseService";
import { createDate } from "../utils/date";
import type firebase from "firebase/compat/app";

export const getHabitById = async (
  habitId: string,
): Promise<Habit | undefined> => {
  const habitRef = doc(db, "habits", habitId);
  const snapshot = await getDoc(habitRef);

  if (!snapshot.exists()) {
    return undefined;
  }

  const data = snapshot.data();

  return {
    id: snapshot.id,
    ...data,
    streak: data.streak.map((s: DayInStreak) => ({
      ...s,
      date: createDate(
        new Date(
          (s.date as unknown as firebase.firestore.Timestamp)?.seconds * 1000,
        ),
      ),
    })),
  } as Habit;
};

export const updateHabit = async (habitId: string, data: Partial<Habit>) => {
  const habitRef = doc(db, "habits", habitId);
  await updateDoc(habitRef, data);
};

export const deleteHabit = async (habitId: string) => {
  const activityRef = doc(db, "habits", habitId);
  return await deleteDoc(activityRef);
};

export const getAllHabits = async (): Promise<Habit[]> => {
  const habitsRef = collection(db, "habits");
  const snapshot = await getDocs(habitsRef);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as unknown as Habit[];
};

export const addHabit = async () => {
  const habitsRef = collection(db, "habits");
  const docRef = await addDoc(habitsRef, {
    name: `Habit ${new Date().toISOString()}`,
    description: "",
    streak: [],
    createdAt: Date.now(),
  });

  return docRef.id;
};
