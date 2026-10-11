import { test, expect, createHabit, reloadWhenSaved } from "./fixtures";
import type { Page } from "@playwright/test";

const titles = (page: Page) => page.locator(".HabitsList-item_title");

test.describe("Sorting habits", () => {
  test("should move a habit with its handle and keep the order after a reload", async ({ signedIn: page }) => {
    for (const name of ["Run", "Read", "Stretch"]) await createHabit(page, name);
    await expect(titles(page)).toHaveText(["Run", "Read", "Stretch"]);

    await page.getByRole("button", { name: "Reorder" }).click();
    // The keyboard way of dragging: pick up, move up two places, drop.
    const handle = page.getByRole("button", { name: "Move Stretch" });
    await handle.focus();
    // Each step is awaited by what a screen reader hears.
    const announced = (text: string, timeout?: number) => expect(page.getByText(text)).toBeAttached({ timeout });
    await page.keyboard.press("Space");
    await announced("Picked up Stretch, position 3 of 3.");
    // dnd-kit starts listening for keys a moment after the pick-up, with nothing to wait
    // on; a key pressed sooner is lost, so the first one is repeated until it lands.
    await expect(async () => {
      await page.keyboard.press("ArrowUp");
      await announced("Stretch moved to position 2 of 3.", 500);
    }).toPass();
    await page.keyboard.press("ArrowUp");
    await announced("Stretch moved to position 1 of 3.");
    await page.keyboard.press("Space");
    await announced("Stretch dropped at position 1 of 3.");
    await expect(page.locator(".HabitsList-reorder_name")).toHaveText(["Stretch", "Run", "Read"]);
    await page.getByRole("button", { name: "Done" }).click();

    await expect(titles(page)).toHaveText(["Stretch", "Run", "Read"]);
    await reloadWhenSaved(page);
    await expect(titles(page)).toHaveText(["Stretch", "Run", "Read"]);

    // A new habit goes last, after the sorted ones.
    await createHabit(page, "Meditate");
    await expect(titles(page)).toHaveText(["Stretch", "Run", "Read", "Meditate"]);
  });
});
