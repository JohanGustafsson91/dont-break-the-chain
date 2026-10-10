import { test, expect, createHabit, reloadWhenSaved, tap, holdDay } from "./fixtures";

const card = (page: import("@playwright/test").Page, name: string) =>
  page.locator(".HabitsList-item", { hasText: name });

test.describe("Habits", () => {
  test("should create a habit, rename it and keep it after a reload", async ({ signedIn: page }) => {
    await page.getByRole("button", { name: "+ Create habit" }).click();

    // The new habit's name is selected, so typing replaces it.
    const name = page.locator('input[type="text"]');
    await expect(name).toHaveValue("New habit");
    await expect(name).toBeFocused();
    await page.keyboard.type("Morning walk");
    await page.getByPlaceholder("Add a description").fill("20 minutes outside");
    await page.getByPlaceholder("Add a description").blur();

    await reloadWhenSaved(page);
    await expect(page.locator('input[type="text"]')).toHaveValue("Morning walk");
    await expect(page.getByPlaceholder("Add a description")).toHaveValue("20 minutes outside");

    await page.getByRole("button", { name: "‹ Habits" }).click();
    await expect(card(page, "Morning walk")).toBeVisible();
    await expect(page.getByRole("button", { name: "+ New habit" })).toBeVisible();
  });

  test("should mark today from the list and keep it after a reload", async ({ signedIn: page }) => {
    await createHabit(page, "Read");
    const done = () => card(page, "Read").getByRole("radio", { name: "Done" });
    const missed = () => card(page, "Read").getByRole("radio", { name: "Missed" });

    await tap(done());
    await expect(done()).toBeChecked();
    await reloadWhenSaved(page);
    await expect(done()).toBeChecked();

    await tap(missed());
    await expect(missed()).toBeChecked();

    // Tapping the checked status again unmarks today.
    await tap(missed());
    await expect(missed()).not.toBeChecked();
    await expect(done()).not.toBeChecked();
  });

  test("should ask before unmarking a day that has a note, from the list", async ({ signedIn: page }) => {
    await createHabit(page, "Yoga");
    await page.getByText("Yoga").click();
    await holdDay(page, new Date().getDate());
    await tap(page.getByRole("radio", { name: "Done" }));
    await page.getByLabel("Note").fill("Felt great");
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.evaluate(() => window.__e2e!.waitForWrites());
    await page.getByRole("button", { name: "‹ Habits" }).click();

    await tap(card(page, "Yoga").getByRole("radio", { name: "Done" }));
    const dialog = page.getByRole("alertdialog", { name: "Remove status?" });
    await expect(dialog).toContainText("Felt great");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(card(page, "Yoga").getByRole("radio", { name: "Done" })).toBeChecked();

    await tap(card(page, "Yoga").getByRole("radio", { name: "Done" }));
    await page.getByRole("alertdialog").getByRole("button", { name: "Remove" }).click();
    await expect(card(page, "Yoga").getByRole("radio", { name: "Done" })).not.toBeChecked();
  });

  test("should mark today with the keyboard only", async ({ signedIn: page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Keyboards are a desktop thing.");
    await createHabit(page, "Journal");

    const done = card(page, "Journal").getByRole("radio", { name: "Done" });
    await done.focus();
    await expect(done).toBeFocused();
    await page.keyboard.press("Space");
    await expect(done).toBeChecked();
  });

  test("should delete a habit only after confirming", async ({ signedIn: page }) => {
    await createHabit(page, "Old habit");
    await page.getByText("Old habit").click();

    await page.getByRole("button", { name: "Delete" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("Old habit");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(page.locator('input[type="text"]')).toHaveValue("Old habit");

    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText("No habits yet")).toBeVisible({ timeout: 25_000 });
  });
});
