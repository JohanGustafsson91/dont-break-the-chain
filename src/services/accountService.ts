import { deleteUser, type User } from "firebase/auth";
import type { Habit } from "../domain/Habit";
import { auth } from "./firebaseService";
import { reauthenticate } from "./authService";
import { deleteAllHabits, getAllHabits } from "./habitService";
import { deleteReminders, getReminderSettings, type ReminderSettings } from "./reminderService";

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

/** Everything stored about the user, in a portable format (GDPR art. 15 and 20). */
export const buildExport = (
  user: Pick<User, "uid" | "displayName" | "email" | "photoURL" | "providerData" | "metadata">,
  habits: Habit[],
  reminders: ReminderSettings | undefined,
  exportedAt: Date,
) => ({
  exportedAt: exportedAt.toISOString(),
  account: {
    id: user.uid,
    name: user.displayName ?? undefined,
    email: user.email ?? undefined,
    pictureUrl: user.photoURL ?? undefined,
    signInProviders: user.providerData.map((p) => p.providerId),
    createdAt: user.metadata.creationTime,
    lastSignInAt: user.metadata.lastSignInTime,
  },
  habits: habits.map((habit) => ({
    id: habit.id,
    name: habit.name,
    description: habit.description,
    goal: habit.goal,
    createdAt: habit.createdAt?.toISOString(),
    days: habit.streak.map((day) => ({
      date: toDateKey(day.date),
      status: day.status,
      notes: day.notes,
    })),
  })),
  reminders: reminders && {
    hour: reminders.hour,
    timeZone: reminders.timeZone,
    lastMarkedDate: reminders.lastMarkedDate,
    lastRemindedDate: reminders.lastRemindedDate,
    devices: reminders.tokens.length,
  },
});

export const downloadMyData = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const now = new Date();
  const [habits, reminders] = await Promise.all([getAllHabits(), getReminderSettings()]);
  const data = buildExport(user, habits, reminders, now);
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, undefined, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `dont-break-the-chain-${toDateKey(now)}.json`;
  link.click();
  // Older Safari fails the download if the URL is revoked in the same tick.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

type DeletionResult =
  | { ok: true }
  | { ok: false; step: "reauthenticate" | "habits" | "account"; error: unknown };

/**
 * Re-authenticates first, so a declined sign-in leaves everything untouched. Habits go
 * before the account: if the last step fails the user is still signed in and can retry.
 */
export const deleteAccountAndData = async (): Promise<DeletionResult> => {
  const user = auth.currentUser;
  if (!user) return { ok: false, step: "reauthenticate", error: new Error("Not signed in") };

  try {
    await reauthenticate(user);
  } catch (error) {
    return { ok: false, step: "reauthenticate", error };
  }

  try {
    await deleteAllHabits();
    await deleteReminders();
  } catch (error) {
    return { ok: false, step: "habits", error };
  }

  try {
    await deleteUser(user);
  } catch (error) {
    return { ok: false, step: "account", error };
  }

  return { ok: true };
};

export const deletionFailureMessage = (
  result: Extract<DeletionResult, { ok: false }>,
) => {
  const code = (result.error as { code?: string } | undefined)?.code;

  if (result.step === "reauthenticate") {
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      return "Nothing was deleted.";
    }
    if (code === "auth/user-mismatch") {
      return "Choose the same account you're signed in with. Nothing was deleted.";
    }
    return "Couldn't confirm it's you. Nothing was deleted.";
  }
  if (result.step === "habits") {
    return "Deleting your habits failed. Please try again.";
  }
  return "Your habits were deleted, but your account couldn't be removed. Please try again.";
};
