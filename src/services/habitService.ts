import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  QueryDocumentSnapshot,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import type { Habit } from "../domain/Habit";
import { auth, db } from "./firebaseService";
import { createDate } from "../utils/date";
import { COLLECTIONS } from "../shared/constants";

export const getHabitById = async (
  habitId: string,
): Promise<Habit | undefined> => {
  const habitRef = doc(db, COLLECTIONS.HABITS, habitId);
  const snapshot = await getDoc(habitRef);

  if (!snapshot.exists()) {
    return undefined;
  }

  return formatHabit(snapshot);
};

export const updateHabit = async (habitId: string, data: Partial<Habit>) => {
  const habitRef = doc(db, COLLECTIONS.HABITS, habitId);
  await updateDoc(habitRef, data);
};

export const deleteHabit = async (habitId: string) => {
  const activityRef = doc(db, COLLECTIONS.HABITS, habitId);
  return await deleteDoc(activityRef);
};

export const getAllHabits = async (): Promise<Habit[]> => {
  const habitsRef = collection(db, COLLECTIONS.HABITS);
  const q = query(
    habitsRef,
    where("author", "==", auth.currentUser?.uid ?? ""),
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(formatHabit);
};

export const addHabit = async () => {
  const habitsRef = collection(db, COLLECTIONS.HABITS);
  const docRef = await addDoc(habitsRef, {
    name: `Habit ${new Date().toISOString()}`,
    description: "",
    streak: [],
    createdAt: Date.now(),
    author: auth.currentUser?.uid ?? "",
  });

  return docRef.id;
};

import type { StreakDay } from "../domain/Habit";

interface FirestoreStreakDay {
  date: Timestamp;
  status: StreakDay["status"];
  notes: string;
}

interface FirestoreHabit {
  name: string;
  description: string;
  streak: FirestoreStreakDay[];
}

function formatHabit(doc: QueryDocumentSnapshot): Habit {
  const data = doc.data() as FirestoreHabit;

  return {
    id: doc.id,
    name: data.name,
    description: data.description,
    streak: data.streak.map((s) => ({
      date: createDate(new Date(s.date.seconds * 1000)),
      status: s.status,
      notes: s.notes,
    })),
  };
}
