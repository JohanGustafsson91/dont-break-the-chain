import { afterEach, describe, it, expect, vi } from "vitest";
import * as firestore from "firebase/firestore";
import type { DocumentReference, DocumentSnapshot, QuerySnapshot } from "firebase/firestore";
import { addHabit, getAllHabits } from "./habitService";

vi.mock("firebase/firestore");

const mockAuth = vi.hoisted(() => ({
  currentUser: { uid: "user-1" } as { uid: string } | null,
}));

vi.mock("./firebaseService", () => ({
  auth: mockAuth,
  db: {},
}));

const firestoreDoc = (id: string, data: object) =>
  ({ id, data: () => data }) as unknown as DocumentSnapshot;

describe("habitService - goals stored in Firestore", () => {
  afterEach(() => {
    mockAuth.currentUser = { uid: "user-1" };
  });

  it("should treat habits saved before goals existed as daily and save new habits as daily", async () => {
    vi.mocked(firestore.getDocs).mockResolvedValue({
      docs: [
        firestoreDoc("legacy", { name: "Old habit", description: "", streak: [] }),
        firestoreDoc("weekly", {
          name: "Gym",
          description: "",
          goal: { type: "weekly", times: 3 },
          streak: [],
        }),
      ],
    } as unknown as QuerySnapshot);

    const habits = await getAllHabits();

    expect(habits.map((h) => h.goal)).toEqual([
      { type: "daily" },
      { type: "weekly", times: 3 },
    ]);

    vi.mocked(firestore.addDoc).mockResolvedValue({ id: "new" } as DocumentReference);

    await addHabit();

    const [, savedHabit] = vi.mocked(firestore.addDoc).mock.calls[0];
    expect(savedHabit).toMatchObject({ goal: { type: "daily" }, author: "user-1" });
  });

  it("should refuse to read or create habits without a signed-in user", async () => {
    mockAuth.currentUser = null;
    vi.mocked(firestore.addDoc).mockClear();

    await expect(getAllHabits()).rejects.toThrow("Not signed in");
    await expect(addHabit()).rejects.toThrow("Not signed in");
    expect(firestore.addDoc).not.toHaveBeenCalled();
  });
});
