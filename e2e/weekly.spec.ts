import { test, expect, createHabit, reloadWhenSaved, tap } from "./fixtures";

test("should track a weekly goal: progress in the list and only a ✓", async ({ signedIn: page }) => {
  await createHabit(page, "Strength");
  await page.getByText("Strength").click();

  await page.getByLabel("Goal").selectOption({ label: "3 times a week" });
  await page.getByRole("button", { name: "‹ Habits" }).click();

  const card = page.locator(".HabitsList-item", { hasText: "Strength" });
  await expect(card).toContainText("0/3 this week");
  await expect(card.getByRole("radio", { name: "Missed" })).toHaveCount(0);

  await tap(card.getByRole("radio", { name: "Done" }));
  await expect(card).toContainText("1/3 this week");
  await reloadWhenSaved(page);
  await expect(page.locator(".HabitsList-item", { hasText: "Strength" })).toContainText("1/3 this week");

  // Back to every day: ✗ is available again.
  await page.getByText("Strength").click();
  await page.getByLabel("Goal").selectOption({ label: "Every day" });
  await page.evaluate(() => window.__e2e!.waitForWrites());
  await page.getByRole("button", { name: "‹ Habits" }).click();
  await expect(page.locator(".HabitsList-item", { hasText: "Strength" }).getByRole("radio", { name: "Missed" })).toHaveCount(1);
});
