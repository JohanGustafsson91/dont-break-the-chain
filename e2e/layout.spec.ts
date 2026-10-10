import { test, expect, createHabit } from "./fixtures";

const hasHorizontalScroll = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test("should never scroll sideways, on the list or a habit's page", async ({ signedIn: page }) => {
  await createHabit(page, "A habit with a rather long name that has to wrap somewhere");
  expect(await hasHorizontalScroll(page)).toBe(false);

  await page.getByText("A habit with a rather long name").click();
  await expect(page.getByTitle(`Day ${new Date().getDate()}`)).toBeVisible();
  expect(await hasHorizontalScroll(page)).toBe(false);
});

test("should show habits side by side on a wide screen", async ({ signedIn: page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Only wide screens use the grid.");
  await createHabit(page, "First");
  await createHabit(page, "Second");

  const [first, second] = await Promise.all(
    ["First", "Second"].map((name) => page.locator(".HabitsList-item", { hasText: name }).boundingBox()),
  );
  // Same row, different columns (the list order follows document ids, not creation).
  expect(first!.y).toBe(second!.y);
  expect(first!.x).not.toBe(second!.x);
});
