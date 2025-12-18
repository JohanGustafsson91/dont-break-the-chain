import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

admin.initializeApp();

const COLLECTIONS = {
  HABITS: "habits",
  USERS: "users",
  FCM_TOKENS: "fcmTokens",
};

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
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * Check if a habit has been logged for today
 */
const hasLoggedToday = (habit: Habit): boolean => {
  if (!habit.streak || habit.streak.length === 0) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastStreakDay = habit.streak[habit.streak.length - 1];
  const lastStreakDate = lastStreakDay.date.toDate();
  lastStreakDate.setHours(0, 0, 0, 0);

  return lastStreakDate.getTime() === today.getTime();
};

/**
 * Get FCM tokens for a user
 */
const getUserTokens = async (userId: string): Promise<string[]> => {
  const tokensSnapshot = await admin
    .firestore()
    .collection(COLLECTIONS.FCM_TOKENS)
    .where("userId", "==", userId)
    .get();

  return tokensSnapshot.docs.map((doc) => (doc.data() as FCMToken).token);
};

/**
 * Send notification to user
 */
const sendNotification = async (
  tokens: string[],
  title: string,
  body: string
): Promise<void> => {
  if (tokens.length === 0) {
    return;
  }

  try {
    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title,
        body,
      },
      webpush: {
        fcmOptions: {
          link: "/",
        },
        notification: {
          icon: "/icon.svg",
          badge: "/icon.svg",
          requireInteraction: false,
        },
      },
    });
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

/**
 * Morning reminder - sent at 7:30 AM daily
 * Reminds users to check in on their habits
 */
export const morningReminder = onSchedule(
  {
    schedule: "30 7 * * *", // Every day at 7:30 AM
    timeZone: "Europe/Stockholm", // Sweden timezone
    region: "us-central1",
  },
  async () => {
    console.log("Running morning reminder...");

    try {
      // Get all users with habits
      const habitsSnapshot = await admin
        .firestore()
        .collection(COLLECTIONS.HABITS)
        .get();

      // Group habits by user
      const userHabits = new Map<string, Habit[]>();
      for (const doc of habitsSnapshot.docs) {
        const habit = doc.data() as Habit;
        const userId = habit.author;

        if (!userHabits.has(userId)) {
          userHabits.set(userId, []);
        }
        const habits = userHabits.get(userId);
        if (habits) {
          habits.push(habit);
        }
      }

      // Send notifications to each user
      const promises = Array.from(userHabits.entries()).map(
        async ([userId, habits]) => {
          const tokens = await getUserTokens(userId);

          if (tokens.length > 0) {
            const habitCount = habits.length;
            await sendNotification(
              tokens,
              "Good morning!",
              `Time to check in on your ${habitCount} habit${
                habitCount > 1 ? "s" : ""
              } for today`
            );
          }
        }
      );

      await Promise.all(promises);
      console.log(`Morning reminders sent to ${userHabits.size} users`);
    } catch (error) {
      console.error("Error in morning reminder:", error);
    }
  }
);

/**
 * Evening reminder - sent at 8:00 PM daily
 * Reminds users about unlogged habits
 */
export const eveningReminder = onSchedule(
  {
    schedule: "0 20 * * *", // Every day at 8:00 PM
    timeZone: "Europe/Stockholm", // Sweden timezone
    region: "us-central1",
  },
  async () => {
    console.log("Running evening reminder...");

    try {
      // Get all habits
      const habitsSnapshot = await admin
        .firestore()
        .collection(COLLECTIONS.HABITS)
        .get();

      // Group habits by user and check if logged
      const userUnloggedHabits = new Map<string, Habit[]>();
      for (const doc of habitsSnapshot.docs) {
        const habit = doc.data() as Habit;
        const userId = habit.author;

        if (!hasLoggedToday(habit)) {
          if (!userUnloggedHabits.has(userId)) {
            userUnloggedHabits.set(userId, []);
          }
          const unloggedHabits = userUnloggedHabits.get(userId);
          if (unloggedHabits) {
            unloggedHabits.push(habit);
          }
        }
      }

      // Send notifications to users with unlogged habits
      const promises = Array.from(userUnloggedHabits.entries()).map(
        async ([userId, unloggedHabits]) => {
          const tokens = await getUserTokens(userId);

          if (tokens.length > 0) {
            const count = unloggedHabits.length;
            await sendNotification(
              tokens,
              "Habit reminder",
              `Don't forget to log ${count} habit${
                count > 1 ? "s" : ""
              } for today!`
            );
          }
        }
      );

      await Promise.all(promises);
      console.log(
        `Evening reminders sent to ${userUnloggedHabits.size} users`
      );
    } catch (error) {
      console.error("Error in evening reminder:", error);
    }
  }
);
