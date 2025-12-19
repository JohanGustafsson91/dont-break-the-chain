import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

admin.initializeApp();

const COLLECTIONS = {
  HABITS: "habits",
  FCM_TOKENS: "fcmTokens",
} as const;

interface StreakDay {
  date: FirebaseFirestore.Timestamp;
  status: "success" | "failure" | "skipped";
  notes: string;
}

interface Habit {
  name: string;
  description: string;
  streak: StreakDay[];
  author: string;
}

interface FCMToken {
  userId: string;
  token: string;
}

const hasLoggedToday = (habit: Habit): boolean => {
  if (!habit.streak?.length) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastStreakDate = habit.streak[habit.streak.length - 1].date.toDate();
  lastStreakDate.setHours(0, 0, 0, 0);

  return lastStreakDate.getTime() === today.getTime();
};

const getUserTokens = async (userId: string): Promise<string[]> => {
  const snapshot = await admin
    .firestore()
    .collection(COLLECTIONS.FCM_TOKENS)
    .where("userId", "==", userId)
    .get();

  return snapshot.docs.map((doc) => (doc.data() as FCMToken).token);
};

const cleanupInvalidToken = async (token: string): Promise<void> => {
  await admin.firestore().collection(COLLECTIONS.FCM_TOKENS).doc(token).delete();
};

const sendNotification = async (
  tokens: string[],
  title: string,
  body: string
): Promise<void> => {
  if (!tokens.length) return;

  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    webpush: {
      fcmOptions: { link: "/" },
      notification: {
        icon: "/web-app-manifest-192x192.png",
        badge: "/web-app-manifest-192x192.png",
        requireInteraction: false,
      },
    },
  });

  const invalidTokens = response.responses
    .map((r, idx) => (r.success ? null : tokens[idx]))
    .filter((token): token is string => token !== null);

  await Promise.all(invalidTokens.map(cleanupInvalidToken));
};

const groupHabitsByUser = (
  habits: Habit[],
  filterFn?: (habit: Habit) => boolean
): Map<string, Habit[]> => {
  const filtered = filterFn ? habits.filter(filterFn) : habits;
  
  return filtered.reduce((acc, habit) => {
    const userHabits = acc.get(habit.author) || [];
    acc.set(habit.author, [...userHabits, habit]);
    return acc;
  }, new Map<string, Habit[]>());
};

const sendUserNotifications = async (
  userHabitsMap: Map<string, Habit[]>,
  getMessage: (count: number) => { title: string; body: string }
): Promise<void> => {
  const notifications = Array.from(userHabitsMap.entries()).map(
    async ([userId, habits]) => {
      const tokens = await getUserTokens(userId);
      const { title, body } = getMessage(habits.length);
      await sendNotification(tokens, title, body);
    }
  );

  await Promise.all(notifications);
};

export const morningReminder = onSchedule(
  {
    schedule: "30 7 * * *",
    timeZone: "Europe/Stockholm",
    region: "us-central1",
  },
  async () => {
    const snapshot = await admin.firestore().collection(COLLECTIONS.HABITS).get();
    const habits = snapshot.docs.map((doc) => doc.data() as Habit);
    const userHabitsMap = groupHabitsByUser(habits);

    await sendUserNotifications(userHabitsMap, (count) => ({
      title: "Good morning!",
      body: `Time to check in on your ${count} habit${count > 1 ? "s" : ""} for today`,
    }));
  }
);

export const eveningReminder = onSchedule(
  {
    schedule: "0 20 * * *",
    timeZone: "Europe/Stockholm",
    region: "us-central1",
  },
  async () => {
    const snapshot = await admin.firestore().collection(COLLECTIONS.HABITS).get();
    const habits = snapshot.docs.map((doc) => doc.data() as Habit);
    const userHabitsMap = groupHabitsByUser(habits, (h) => !hasLoggedToday(h));

    await sendUserNotifications(userHabitsMap, (count) => ({
      title: "Habit reminder",
      body: `Don't forget to log ${count} habit${count > 1 ? "s" : ""} for today!`,
    }));
  }
);
