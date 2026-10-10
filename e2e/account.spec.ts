import { readFile } from "node:fs/promises";
import { test, expect, createHabit } from "./fixtures";

test.describe("Account menu", () => {
  test("should export all habits as JSON, without push tokens", async ({ signedIn: page }) => {
    await createHabit(page, "Meditate");
    await page.evaluate(() => window.__e2e!.seedReminder());

    await page.getByRole("button", { name: "Account menu" }).click();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export my data" }).click();
    const file = await (await download).path();

    const data = JSON.parse(await readFile(file, "utf8"));
    expect(data.account.email).toBe(process.env.E2E_EMAIL);
    expect(data.habits.map((h: { name: string }) => h.name)).toEqual(["Meditate"]);
    // Reminder settings are included, but only a device count instead of the tokens.
    expect(data.reminders).toMatchObject({ hour: 20, timeZone: "Europe/Stockholm", devices: 1 });
    expect(JSON.stringify(data)).not.toContain("fake-device-token-for-e2e");
    await expect(page.getByRole("status")).toHaveText(/Your data has been downloaded/);
  });

  test("should open the daily reminder settings and close them again", async ({ signedIn: page }) => {
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("button", { name: "Daily reminder" }).click();

    const dialog = page.getByRole("dialog", { name: "Daily reminder" });
    await expect(dialog).toBeVisible();
    // Which buttons show depends on the browser's push support; there is always a way out.
    await dialog.getByRole("button", { name: /^(Close|Cancel)$/ }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("should reach the legal pages from the menu", async ({ signedIn: page }) => {
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("link", { name: "Privacy policy" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Privacy policy" })).toBeVisible();

    await page.goBack();
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("link", { name: "Terms of use" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Terms of use" })).toBeVisible();
  });
});
