import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vitest";

vi.mock("../../services/authService.ts", () => ({
  useAuth: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("../../services/habitService.ts", () => ({
  getAllHabits: vi.fn(),
  getHabitById: vi.fn(),
}));

vi.mock("../../services/firebaseService.ts", () => ({
  auth: vi.fn(),
  db: vi.fn(),
}));

import { render, screen } from "@testing-library/react";
import { useAuth } from "../../services/authService";
import { getAllHabits, getHabitById } from "../../services/habitService";
import userEvent from "@testing-library/user-event";
import { App } from "./App";

beforeAll(() => {
  vi.setSystemTime(new Date("2025-02-10T00:00:00Z"));
});

afterAll(() => {
  vi.useRealTimers();
});

it("should render habits", async () => {
  (useAuth as jest.Mock)
    .mockReturnValueOnce({
      status: "PENDING",
      user: undefined,
    })
    .mockReturnValue({
      status: "RESOLVED",
      user: { uid: "123", email: "test@example.com" },
    });
  (getAllHabits as jest.Mock).mockReturnValue([habitData()]);
  (getHabitById as jest.Mock).mockReturnValueOnce(habitData());

  render(<App />);

  expect(screen.getByText(/Loading/i)).toBeInTheDocument();

  render(<App />);

  const habitName = await screen.findByText(/Healthy/i);

  expect(habitName).toBeInTheDocument();

  await userEvent.click(habitName);

  expect(await screen.findByText(/Healthy/i)).toBeInTheDocument();
  expect(await screen.findByText(/Eat and be healthy/i)).toBeInTheDocument();
  expect(await screen.findByText(/Good: 5 days/i)).toBeInTheDocument();
  expect(await screen.findByText(/Bad: 1 days/i)).toBeInTheDocument();
  expect(await screen.findByText(/83.3%/i)).toBeInTheDocument();
  expect(await screen.findByText(/February 2025/i)).toBeInTheDocument();
  expect(await screen.findByText(/Longest/i)).toBeInTheDocument();
  expect(await screen.findByText(/3 days/i)).toBeInTheDocument();
  expect(await screen.findByText(/Current/i)).toBeInTheDocument();
  expect(await screen.findByText(/2 days/i)).toBeInTheDocument();

  const daysInMonth = Array.from({ length: 28 }, (_, i) => i + 1);
  daysInMonth.forEach((day) =>
    expect(screen.getByTitle(`Day ${day}`)).toBeInTheDocument(),
  );
  expect(screen.queryByTitle("Day 29")).not.toBeInTheDocument();
});

const habitData = () => ({
  id: "H2Jui9vlLL4fVLZViudr",
  description: "Eat and be healthy",
  createdAt: 1739101134331,
  streak: [
    {
      notes: "",
      date: new Date("2025-02-09T00:00:00.000Z"),
      status: "GOOD",
    },
    {
      notes: "",
      date: new Date("2025-02-08T00:00:00.000Z"),
      status: "GOOD",
    },
    {
      notes: "Dålig sömn. ",
      date: new Date("2025-02-07T00:00:00.000Z"),
      status: "BAD",
    },
    {
      notes: "",
      date: new Date("2025-02-06T00:00:00.000Z"),
      status: "GOOD",
    },
    {
      notes: "",
      date: new Date("2025-02-05T00:00:00.000Z"),
      status: "GOOD",
    },
    {
      notes: "",
      date: new Date("2025-02-04T00:00:00.000Z"),
      status: "GOOD",
    },
  ],
  name: "Healthy",
});
