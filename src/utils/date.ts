// Calendar days are stored as UTC midnight. "Today" is the user's *local* date in
// that same representation, and calendar days are always read and formatted in UTC.

export const getToday = (now: Date = new Date()): Date =>
  createDate({ year: now.getFullYear(), month: now.getMonth(), day: now.getDate() });

export const formatDay = (
  date: Date,
  options: Intl.DateTimeFormatOptions,
): string => date.toLocaleDateString("en-US", { ...options, timeZone: "UTC" });

export const getMonthName = (date: Date) => formatDay(date, { month: "long" });

export const getWeekDayName = (date: Date) =>
  formatDay(date, { weekday: "long" });

export function createDate(
  input: Date | string | { year: number; month: number; day: number },
): Date {
  if (input instanceof Date) {
    return new Date(
      Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()),
    );
  }

  if (typeof input === "string") {
    const [year, month, day] = input.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  if (typeof input === "object" && input !== null) {
    return new Date(Date.UTC(input.year, input.month, input.day));
  }

  throw new Error("Invalid input type for createDate");
}

export function isSameDay(dateOne: Date, dateTwo: Date) {
  return (
    dateOne.getUTCFullYear() === dateTwo.getUTCFullYear() &&
    dateOne.getUTCMonth() === dateTwo.getUTCMonth() &&
    dateOne.getUTCDate() === dateTwo.getUTCDate()
  );
}

export function isBeforeOrSameDay(date: Date, today = getToday()): boolean {
  return createDate(date).getTime() <= today.getTime();
}

const ONE_DAY_IN_MS = 86400000;

export function isNextDay(prev: Date, current: Date): boolean {
  return (
    Date.UTC(
      current.getUTCFullYear(),
      current.getUTCMonth(),
      current.getUTCDate(),
    ) -
      Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth(), prev.getUTCDate()) ===
    ONE_DAY_IN_MS
  );
}

export function isYesterday(prev: Date, current = getToday()): boolean {
  const prevUTC = Date.UTC(
    prev.getUTCFullYear(),
    prev.getUTCMonth(),
    prev.getUTCDate(),
  );
  const currentUTC = Date.UTC(
    current.getUTCFullYear(),
    current.getUTCMonth(),
    current.getUTCDate(),
  );

  return currentUTC - prevUTC === ONE_DAY_IN_MS;
}

export function isNextMonthDisabled(currentDate: Date): boolean {
  const today = getToday();

  return (
    currentDate.getUTCFullYear() === today.getUTCFullYear() &&
    currentDate.getUTCMonth() === today.getUTCMonth()
  );
}
