export const AUTH_PROVIDERS = {
  GITHUB: "github" as const,
} as const;

export const AUTH_STATUS = {
  PENDING: "PENDING" as const,
  REJECTED: "REJECTED" as const,
  RESOLVED: "RESOLVED" as const,
} as const;

export const HABIT_STATUS = {
  GOOD: "GOOD" as const,
  BAD: "BAD" as const,
  NOT_SPECIFIED: "NOT_SPECIFIED" as const,
} as const;

export const COLLECTIONS = {
  HABITS: "habits" as const,
} as const;

export const STREAK_ICONS = {
  CURRENT: "🔄",
  LONGEST: "🔥",
} as const;