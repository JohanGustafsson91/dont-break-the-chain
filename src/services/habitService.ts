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
} from "firebase/firestore";
import type { DayInStreak, Habit } from "../shared/Habit";
import { auth, db } from "./firebaseService";
import { createDate } from "../utils/date";
import type firebase from "firebase/compat/app";
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

function formatHabit(doc: QueryDocumentSnapshot) {
  const data = doc.data();

  return {
    id: doc.id,
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
}
