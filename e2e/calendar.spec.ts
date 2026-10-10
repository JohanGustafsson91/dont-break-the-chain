import { test, expect, createHabit, reloadWhenSaved, tap, calendarDay, holdDay, holdDayFor } from "./fixtures";

test.describe("A habit's calendar", () => {
  test("should cycle a day's status with taps", async ({ signedIn: page }) => {
    await createHabit(page, "Water");
    await page.getByText("Water").click();
    const today = new Date().getDate();

    await calendarDay(page, today).click();
    await expect(calendarDay(page, today)).toHaveClass(/Calendar-day_success/);
    await calendarDay(page, today).click();
    await expect(calendarDay(page, today)).toHaveClass(/Calendar-day_error/);
    await reloadWhenSaved(page);
    await expect(calendarDay(page, today)).toHaveClass(/Calendar-day_error/);
    await calendarDay(page, today).click();
    await expect(calendarDay(page, today)).not.toHaveClass(/Calendar-day_(success|error)/);
  });

  test("should mark a day with a note, keep both, and ask before removing them", async ({ signedIn: page }) => {
    await createHabit(page, "Gym");
    await page.getByText("Gym").click();
    const today = new Date().getDate();

    await holdDay(page, today);
    await tap(page.getByRole("radio", { name: "Done" }));
    await page.getByLabel("Note").fill("Legs day");
    await page.getByRole("button", { name: "Done", exact: true }).click();

    await reloadWhenSaved(page);
    await expect(calendarDay(page, today)).toHaveClass(/Calendar-day_success/);
    await expect(calendarDay(page, today)).toContainText("*"); // has a note
    await holdDay(page, today);
    await expect(page.getByLabel("Note")).toHaveValue("Legs day");

    // Change it to ✗ and edit the note; both are kept.
    await tap(page.getByRole("radio", { name: "Missed" }));
    await page.getByLabel("Note").fill("Skipped, sore legs");
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await reloadWhenSaved(page);
    await expect(calendarDay(page, today)).toHaveClass(/Calendar-day_error/);
    await holdDay(page, today);
    await expect(page.getByLabel("Note")).toHaveValue("Skipped, sore legs");

    // Unmarking would delete the note, so it asks first.
    await tap(page.getByRole("radio", { name: "Missed" }));
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("Skipped, sore legs");
    await dialog.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByLabel("Note")).toBeDisabled();
  });

  test("should not allow marking days in the future", async ({ signedIn: page }) => {
    await createHabit(page, "Stretch");
    await page.getByText("Stretch").click();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    test.skip(tomorrow.getDate() === 1, "Tomorrow is in next month, which the calendar doesn't show.");
    await calendarDay(page, tomorrow.getDate()).click();
    await expect(calendarDay(page, tomorrow.getDate())).not.toHaveClass(/Calendar-day_(success|error)/);
    await holdDayFor(page, tomorrow.getDate(), 800);
    await expect(page.getByRole("button", { name: "Done", exact: true })).toHaveCount(0);
  });

  test("should go back a month and not past the current one", async ({ signedIn: page }) => {
    await createHabit(page, "Walk");
    await page.getByText("Walk").click();

    const label = (date: Date) =>
      `${date.toLocaleDateString("en-US", { month: "long" })} ${date.getFullYear()}`;
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    await expect(page.getByText(label(now))).toBeVisible();
    await expect(page.getByRole("button", { name: "Next month" })).toBeDisabled();
    await page.getByRole("button", { name: "Previous month" }).click();
    await expect(page.getByText(label(lastMonth))).toBeVisible();
    await expect(page.getByRole("button", { name: "Next month" })).toBeEnabled();
  });
});
