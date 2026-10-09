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
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { DAILY_GOAL, type Goal, type Habit, type StreakDay } from "../domain/Habit";
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

// Habits are owned by the signed-in user; an empty author would create orphans
// that the security rules make unreachable.
const currentUserId = () => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  return uid;
};

export const getAllHabits = async (): Promise<Habit[]> => {
  const habitsRef = collection(db, COLLECTIONS.HABITS);
  const q = query(habitsRef, where("author", "==", currentUserId()));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(formatHabit);
};

// Batches have historically been capped at 500 writes; chunking keeps us within it.
const BATCH_LIMIT = 500;

export const deleteAllHabits = async () => {
  const habitsRef = collection(db, COLLECTIONS.HABITS);
  const snapshot = await getDocs(
    query(habitsRef, where("author", "==", currentUserId())),
  );

  for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    snapshot.docs.slice(i, i + BATCH_LIMIT).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
};

export const addHabit = async () => {
  const habitsRef = collection(db, COLLECTIONS.HABITS);
  const docRef = await addDoc(habitsRef, {
    name: "New habit",
    description: "",
    goal: DAILY_GOAL,
    streak: [],
    createdAt: Date.now(),
    author: currentUserId(),
  });

  return docRef.id;
};



interface FirestoreStreakDay {
  date: Timestamp;
  status: StreakDay["status"];
  notes: string;
}

interface FirestoreHabit {
  name: string;
  description: string;
  goal?: Goal;
  streak: FirestoreStreakDay[];
  createdAt?: number;
}

function formatHabit(doc: QueryDocumentSnapshot): Habit {
  const data = doc.data() as FirestoreHabit;

  return {
    id: doc.id,
    name: data.name,
    description: data.description,
    goal: data.goal ?? DAILY_GOAL,
    createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
    streak: data.streak.map((s) => ({
      date: createDate(new Date(s.date.seconds * 1000)),
      status: s.status,
      notes: s.notes,
    })),
  };
}
