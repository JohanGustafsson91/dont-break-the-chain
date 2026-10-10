import { test as base, expect, type Locator, type Page } from "@playwright/test";

/**
 * The test account for a browser project. Each browser has its own account, so CI can
 * run the browsers in parallel (a shared account would have tests deleting each
 * other's habits): WebKit uses E2E_WEBKIT_*, everything else E2E_*.
 */
export const credentials = (project: string) => {
  const prefix = project.includes("webkit") ? "E2E_WEBKIT" : "E2E";
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (!email || !password) {
    throw new Error(`Set ${prefix}_EMAIL and ${prefix}_PASSWORD (or .env.e2e.local) to run the ${project} tests.`);
  }
  return { email, password };
};

/** Where a browser's signed-in session is saved by auth.setup.ts. */
export const authFile = (project: string) => `playwright/.auth/${project.replace(/^setup-/, "")}.json`;

/**
 * Opens the app signed in (from the saved session), starting from no habits. It starts
 * on a page that loads no habits, resets, and then goes to the list inside the app: one
 * page load per test, since every load asks Firebase Auth to restore the session.
 */
export const startFresh = async (page: Page) => {
  await page.goto("/terms");
  await page.waitForFunction(() => window.__e2e !== undefined);
  expect(await page.evaluate(() => window.__e2e!.whenSignedIn()), "the saved session signs in").toBe(true);
  await page.evaluate(() => window.__e2e!.reset());
  await page.getByRole("link", { name: "‹ Back to the app" }).click();
  await expect(page.getByText("No habits yet")).toBeVisible({ timeout: 20_000 });
};

// Every test starts from the saved session (see playwright.config.ts); signed-out tests
// clear it with test.use (see auth.spec.ts).
export const test = base.extend<{ signedIn: Page }>({
  signedIn: async ({ page }, use) => {
    await startFresh(page);
    await use(page);
  },
});

export { expect };

/** Reloads once every save has reached the server; otherwise a reload can drop it. */
export const reloadWhenSaved = async (page: Page) => {
  await page.evaluate(() => window.__e2e!.waitForWrites());
  await page.reload();
};

/** Creates a habit from the list and returns to the list. */
export const createHabit = async (page: Page, name: string) => {
  await page.getByRole("button", { name: /Create habit|New habit/ }).click();
  const field = page.locator('input[type="text"]');
  // Creating waits for Firestore to confirm, which is sometimes slow in dev.
  await expect(field).toHaveValue("New habit", { timeout: 20_000 });
  await expect(field).toBeFocused();
  await field.fill(name);
  await field.blur();
  await page.evaluate(() => window.__e2e!.waitForWrites());
  await page.getByRole("button", { name: "‹ Habits" }).click();
  await expect(habitTitle(page, name)).toBeVisible();
};

/**
 * A habit's title on the list. Exact, because getByText matches substrings
 * case-insensitively, and status lines like "Start your first day" contain words.
 */
export const habitTitle = (page: Page, name: string) =>
  page.locator(".HabitsList-item_title").getByText(name, { exact: true });

/** Opens a habit's page from the list. */
export const openHabit = (page: Page, name: string) => habitTitle(page, name).click();

/**
 * Taps a ✓/✗ status button. The radio itself is visually hidden (it's there for
 * keyboards and screen readers), so it is found by its role and its label is tapped,
 * like a person would.
 */
export const tap = (radio: Locator) => radio.locator("xpath=ancestor::label[1]").click();

/** Taps a calendar day, which cycles its status. */
export const calendarDay = (page: Page, day: number) => page.getByTitle(`Day ${day}`, { exact: true });

/**
 * Holds a calendar day until the sheet for its status and note opens. Right after a
 * reload the first press can land before the app listens; such a press registers
 * nothing (releasing it changes no status), so it simply tries again.
 */
export const holdDay = async (page: Page, day: number) => {
  const done = page.getByRole("button", { name: "Done", exact: true });
  for (let attempt = 1; ; attempt++) {
    await calendarDay(page, day).hover();
    await page.mouse.down();
    try {
      await expect(done).toBeVisible({ timeout: 3000 });
      await page.mouse.up();
      return;
    } catch (error) {
      await page.mouse.up();
      if (attempt === 3) throw error;
    }
  }
};

/** Holds a day for longer than a long press (500 ms) without expecting a sheet. */
export const holdDayFor = async (page: Page, day: number, ms: number) => {
  await calendarDay(page, day).hover();
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
};
