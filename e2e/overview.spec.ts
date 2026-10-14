import { test, expect } from "./fixtures";

test.describe("Overview", () => {
  test("should show every habit's recent days and open a habit from there", async ({ signedIn: page }) => {
    // Oldest day first, today last: "g" done, "b" missed, "-" not marked.
    await page.evaluate(async () => {
      await window.__e2e!.seedHabit("Read", "gggbgg-");
      await window.__e2e!.seedHabit("Run", "-g");
      await window.__e2e!.waitForWrites();
    });

    await page.getByRole("link", { name: "Overview" }).click();
    await expect(page).toHaveURL(/\/overview$/);
    // The switch keeps focus across the change, for keyboards and screen readers.
    await expect(page.getByRole("link", { name: "Overview" })).toBeFocused();

    // Read: six days up to yesterday, five done, and today not marked yet, so it doesn't
    // count. Run: yesterday not marked, today done.
    await expect(page.getByText(/Daily habits: 6 of 8\s+checked off/)).toBeVisible();
    const read = page.getByRole("button", { name: /^Read: 5 done, 1 missed/ });
    await expect(read).toBeVisible();
    await expect(page.getByRole("button", { name: /^Run: 1 done, 0 missed/ })).toBeVisible();

    // A habit opened from here goes back to the overview.
    await read.click();
    await expect(page.locator('input[type="text"]')).toHaveValue("Read");
    await page.getByRole("button", { name: "‹ Overview" }).click();
    await expect(page).toHaveURL(/\/overview$/);

    await page.getByRole("link", { name: "Today" }).click();
    await expect(page.getByRole("heading", { name: "Your habits" })).toBeVisible();
  });
});
