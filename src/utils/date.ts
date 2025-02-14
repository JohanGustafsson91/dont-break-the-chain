export const getMonthName = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "long" });

export const getWeekDayName = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "long" });

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

export function isBeforeOrSameDay(date: Date, today = new Date()): boolean {
  const todayCopy = new Date(today);
  const dateCopy = new Date(date);

  todayCopy.setHours(0, 0, 0, 0);
  dateCopy.setHours(0, 0, 0, 0);

  return dateCopy <= todayCopy;
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

export function isYesterday(prev: Date, current = new Date()): boolean {
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
  const now = new Date();

  return (
    currentDate.getFullYear() === now.getFullYear() &&
    currentDate.getMonth() === now.getMonth()
  );
}
