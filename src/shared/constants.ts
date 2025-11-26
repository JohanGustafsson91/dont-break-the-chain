// Authentication constants
export const AUTH_PROVIDERS = {
  GITHUB: "github" as const,
} as const;

export const AUTH_STATUS = {
  PENDING: "PENDING" as const,
  REJECTED: "REJECTED" as const,
  RESOLVED: "RESOLVED" as const,
} as const;

// Habit status constants  
export const HABIT_STATUS = {
  GOOD: "GOOD" as const,
  BAD: "BAD" as const,
} as const;

// Firebase collection names
export const COLLECTIONS = {
  HABITS: "habits" as const,
} as const;