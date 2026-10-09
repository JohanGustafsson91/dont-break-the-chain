import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";

// Runs against the Firestore emulator via `pnpm test:rules`. The demo- project id
// never touches a real Firebase project.
let env: RulesTestEnvironment;

const ALICE = "alice";
const BOB = "bob";

const newHabit = (author: string) => ({
  name: "Morning run",
  description: "",
  goal: { type: "daily" },
  streak: [],
  createdAt: Date.now(),
  author,
});

const db = (uid?: string) =>
  (uid
    ? env.authenticatedContext(uid).firestore()
    : env.unauthenticatedContext().firestore()) as unknown as Firestore;

const seed = (id: string, data: object) =>
  env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore() as unknown as Firestore, "habits", id), data);
  });

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-dbtc",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed("alice-habit", newHabit(ALICE));
});

afterAll(async () => {
  await env.cleanup();
});

describe("Firestore rules - habits belong to one user", () => {
  it("should let users create habits only for themselves, with valid data", async () => {
    await assertSucceeds(setDoc(doc(db(ALICE), "habits", "new"), newHabit(ALICE)));

    await assertFails(setDoc(doc(db(ALICE), "habits", "forged"), newHabit(BOB)));
    // Overwriting someone else's habit with set() is an update, not a create.
    await assertFails(setDoc(doc(db(BOB), "habits", "alice-habit"), newHabit(BOB)));
    await assertFails(setDoc(doc(db(), "habits", "anonymous"), newHabit(ALICE)));
    await assertFails(
      setDoc(doc(db(ALICE), "habits", "extra"), { ...newHabit(ALICE), isAdmin: true }),
    );
    for (const goal of [
      { type: "weekly", times: 7 },
      { type: "weekly" },
      { type: "daily", times: 3 },
    ]) {
      await assertFails(
        setDoc(doc(db(ALICE), "habits", "bad-goal"), { ...newHabit(ALICE), goal }),
      );
    }
    await assertFails(
      setDoc(doc(db(ALICE), "habits", "long-name"), { ...newHabit(ALICE), name: "x".repeat(201) }),
    );
    await assertFails(
      setDoc(doc(db(ALICE), "habits", "bad-created-at"), { ...newHabit(ALICE), createdAt: "today" }),
    );
    await assertFails(
      setDoc(doc(db(ALICE), "habits", "no-goal"), {
        name: "No goal",
        description: "",
        streak: [],
        author: ALICE,
      }),
    );
  });

  it("should only let the owner read a habit, and only list their own", async () => {
    await assertSucceeds(getDoc(doc(db(ALICE), "habits", "alice-habit")));
    await assertFails(getDoc(doc(db(BOB), "habits", "alice-habit")));
    await assertFails(getDoc(doc(db(), "habits", "alice-habit")));

    const habits = (uid: string) => collection(db(uid), "habits");
    await assertSucceeds(getDocs(query(habits(ALICE), where("author", "==", ALICE))));
    await assertFails(getDocs(query(habits(BOB), where("author", "==", ALICE))));
    await assertFails(getDocs(habits(BOB)));

    const anonymousHabits = collection(db(), "habits");
    await assertFails(getDocs(query(anonymousHabits, where("author", "==", ALICE))));
    await assertFails(getDocs(query(anonymousHabits, where("author", "==", ""))));
  });

  it("should only let the owner make valid changes, never to the author", async () => {
    const aliceHabit = (uid?: string) => doc(db(uid), "habits", "alice-habit");
    const today = { date: Timestamp.fromDate(new Date("2025-02-15")), status: "GOOD", notes: "" };

    await assertSucceeds(updateDoc(aliceHabit(ALICE), { streak: [today] }));
    await assertSucceeds(updateDoc(aliceHabit(ALICE), { name: "Evening run", description: "5 km" }));
    await assertSucceeds(updateDoc(aliceHabit(ALICE), { goal: { type: "weekly", times: 3 } }));

    await assertFails(updateDoc(aliceHabit(BOB), { name: "Hacked" }));
    await assertFails(updateDoc(aliceHabit(), { name: "Hacked" }));
    await assertFails(updateDoc(aliceHabit(ALICE), { author: BOB }));
    await assertFails(setDoc(aliceHabit(ALICE), { author: BOB }, { merge: true }));
    await assertFails(updateDoc(aliceHabit(ALICE), { isAdmin: true }));
    await assertFails(updateDoc(aliceHabit(ALICE), { name: "" }));
    await assertFails(updateDoc(aliceHabit(ALICE), { goal: { type: "weekly", times: 0 } }));
    await assertFails(updateDoc(aliceHabit(ALICE), { streak: "not a list" }));
  });

  it("should keep habits from older app versions editable", async () => {
    // Older documents may lack `goal` and carry fields the rules don't know about.
    await seed("legacy", {
      name: "Old habit",
      description: "",
      streak: [],
      createdAt: 1700000000000,
      author: ALICE,
      someOldField: "kept as is",
    });
    const legacy = doc(db(ALICE), "habits", "legacy");

    await assertSucceeds(getDoc(legacy));
    await assertSucceeds(updateDoc(legacy, { name: "Renamed" }));
    await assertSucceeds(updateDoc(legacy, { goal: { type: "daily" } }));
  });

  it("should deny every other collection, including the old fcmTokens", async () => {
    await assertFails(
      setDoc(doc(db(ALICE), "fcmTokens", "token"), { userId: ALICE, token: "abc" }),
    );
    await assertFails(getDoc(doc(db(ALICE), "users", ALICE)));
  });

  it("should only let the owner delete a habit", async () => {
    await assertFails(deleteDoc(doc(db(BOB), "habits", "alice-habit")));
    await assertSucceeds(deleteDoc(doc(db(ALICE), "habits", "alice-habit")));
  });
});

describe("Firestore rules - reminder settings belong to one user", () => {
  const reminder = { hour: 20, timeZone: "Europe/Stockholm", tokens: ["device-a"] };

  it("should let users save only their own, valid reminder settings", async () => {
    const own = doc(db(ALICE), "reminders", ALICE);
    await assertSucceeds(setDoc(own, reminder));
    await assertSucceeds(
      setDoc(own, { tokens: arrayUnion("device-b"), hour: 7 }, { merge: true }),
    );
    await assertSucceeds(updateDoc(own, { lastMarkedDate: "2026-10-09" }));

    await assertFails(setDoc(doc(db(ALICE), "reminders", BOB), reminder));
    await assertFails(setDoc(doc(db(), "reminders", ALICE), reminder));
    for (const invalid of [
      { ...reminder, hour: 24 },
      { ...reminder, hour: "20" },
      { ...reminder, timeZone: "" },
      { ...reminder, tokens: Array.from({ length: 11 }, (_, i) => `t${i}`) },
      { ...reminder, lastMarkedDate: "today" },
      { ...reminder, isAdmin: true },
      { hour: 20, tokens: [] },
    ]) {
      await assertFails(setDoc(own, invalid));
    }
  });

  it("should only let the owner read or delete reminder settings", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore() as unknown as Firestore, "reminders", ALICE), reminder);
    });

    await assertFails(getDoc(doc(db(BOB), "reminders", ALICE)));
    await assertFails(updateDoc(doc(db(BOB), "reminders", ALICE), { hour: 8 }));
    await assertFails(deleteDoc(doc(db(BOB), "reminders", ALICE)));
    await assertSucceeds(getDoc(doc(db(ALICE), "reminders", ALICE)));
    await assertSucceeds(deleteDoc(doc(db(ALICE), "reminders", ALICE)));
  });
});
