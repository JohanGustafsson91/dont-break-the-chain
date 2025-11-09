import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  createDate,
  isSameDay,
  isNextDay,
  isYesterday,
  isBeforeOrSameDay,
  isNextMonthDisabled,
} from "./date";

describe("Date utilities for streak tracking", () => {
  beforeAll(() => {
    vi.setSystemTime(new Date("2025-02-10T00:00:00Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe("createDate - normalizing dates to UTC midnight", () => {
    it("should normalize dates to UTC midnight regardless of input time", () => {
      const morning = createDate(new Date("2025-02-10T08:30:45.123Z"));
      const evening = createDate(new Date("2025-02-10T23:59:59.999Z"));

      expect(morning.toISOString()).toBe("2025-02-10T00:00:00.000Z");
      expect(evening.toISOString()).toBe("2025-02-10T00:00:00.000Z");
      expect(isSameDay(morning, evening)).toBe(true);
    });

    it("should create date from string format YYYY-MM-DD", () => {
      const result = createDate("2025-02-10");
      expect(result.toISOString()).toBe("2025-02-10T00:00:00.000Z");
    });

    it("should create date from object with year/month/day", () => {
      const result = createDate({ year: 2025, month: 1, day: 10 });
      expect(result.getUTCFullYear()).toBe(2025);
      expect(result.getUTCMonth()).toBe(1);
      expect(result.getUTCDate()).toBe(10);
    });
  });

  describe("isSameDay - critical for finding today's entry", () => {
    it("should return true for same calendar day despite different times", () => {
      const date1 = new Date("2025-02-10T00:00:00.000Z");
      const date2 = new Date("2025-02-10T23:59:59.999Z");

      expect(isSameDay(date1, date2)).toBe(true);
    });

    it("should return false for different days", () => {
      const today = new Date("2025-02-10T23:59:59.000Z");
      const tomorrow = new Date("2025-02-11T00:00:00.000Z");

      expect(isSameDay(today, tomorrow)).toBe(false);
    });
  });

  describe("isNextDay - critical for streak calculation", () => {
    it("should return true when dates are consecutive", () => {
      const monday = new Date("2025-02-10T00:00:00.000Z");
      const tuesday = new Date("2025-02-11T00:00:00.000Z");

      expect(isNextDay(monday, tuesday)).toBe(true);
    });

    it("should return false when there's a gap", () => {
      const monday = new Date("2025-02-10T00:00:00.000Z");
      const wednesday = new Date("2025-02-12T00:00:00.000Z");

      expect(isNextDay(monday, wednesday)).toBe(false);
    });

    it("should work across month boundaries", () => {
      const feb28 = new Date("2025-02-28T00:00:00.000Z");
      const mar1 = new Date("2025-03-01T00:00:00.000Z");

      expect(isNextDay(feb28, mar1)).toBe(true);
    });

    it("should work across year boundaries", () => {
      const dec31 = new Date("2024-12-31T00:00:00.000Z");
      const jan1 = new Date("2025-01-01T00:00:00.000Z");

      expect(isNextDay(dec31, jan1)).toBe(true);
    });
  });

  describe("isYesterday - for determining active streaks", () => {
    it("should return true for yesterday (today is Feb 10)", () => {
      const yesterday = new Date("2025-02-09T00:00:00.000Z");
      expect(isYesterday(yesterday)).toBe(true);
    });

    it("should return false for today", () => {
      const today = new Date("2025-02-10T00:00:00.000Z");
      expect(isYesterday(today)).toBe(false);
    });

    it("should return false for older dates", () => {
      const twoDaysAgo = new Date("2025-02-08T00:00:00.000Z");
      expect(isYesterday(twoDaysAgo)).toBe(false);
    });
  });

  describe("isBeforeOrSameDay - for calendar UI", () => {
    it("should allow marking past and current day", () => {
      const yesterday = new Date("2025-02-09T00:00:00.000Z");
      const today = new Date("2025-02-10T00:00:00.000Z");

      expect(isBeforeOrSameDay(yesterday)).toBe(true);
      expect(isBeforeOrSameDay(today)).toBe(true);
    });

    it("should prevent marking future dates", () => {
      const tomorrow = new Date("2025-02-11T00:00:00.000Z");
      expect(isBeforeOrSameDay(tomorrow)).toBe(false);
    });
  });

  describe("isNextMonthDisabled - for calendar navigation", () => {
    it("should disable next month button when viewing current month", () => {
      const currentMonth = new Date("2025-02-01T00:00:00.000Z");
      expect(isNextMonthDisabled(currentMonth)).toBe(true);
    });

    it("should allow navigating to next month when viewing past", () => {
      const lastMonth = new Date("2025-01-15T00:00:00.000Z");
      expect(isNextMonthDisabled(lastMonth)).toBe(false);
    });
  });
});
