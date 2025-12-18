# Analyze

## Tech Stack

- Use Firebase for ease of development.
- The backend will be within the frontend since we're using Firebase, but it should be structured so that we can easily switch to another backend in the future (e.g., SQL database).

## Data Model

### User

- ID, name, optional settings.

### Goal

- ID, name, optional description, created date, user ID.
- CRUD operations should be supported.

### Streak (Log per day)

- Goal ID, date, status (green checkmark/red cross), optional comment.

## Functionality

- Users can create goals with streaks.
- Each goal should have a separate detailed view.
- The streak consists of consecutive dates.
- Users should be able to add notes to specific days (e.g., explaining why they missed a day).
- Potential future feature: reminders/notifications for specific goals.

## UI/UX

- The main UI should be a calendar displaying:
  - Green checkmarks for completed goals.
  - Red crosses for missed goals.
  - Potential additional color for "missed with a valid reason."
- Each goal has its own detail view, showing:
  - Current streak.
  - Longest streak.
  - Percentage of successful days since start.
  - Insights (e.g., average streak length, trend analysis).
- A summary view should show all active goals and their streaks at a glance.

## Development Strategy

- Start with a frontend prototype using mock data and Storybook.
- Structure Firebase interactions to allow for future backend changes.
- Ensure the UI is intuitive and provides motivation through progress tracking and insights.
