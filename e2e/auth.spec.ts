import { test, expect, credentials } from "./fixtures";

test.describe("Signed out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("should let a visitor try a habit, switch language and sign in without ticking anything", async ({ page }) => {
    await page.goto("/login");

    // Signing in is accepting the terms, so the buttons work straight away.
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Continue with GitHub" })).toBeEnabled();

    // One tap on the demo habit completes a week.
    await expect(page.getByText("Today is day 7 🎯")).toBeVisible();
    await page.getByRole("button", { name: "Mark today as done" }).click();
    await expect(page.getByText("7 days in a row 🎉")).toBeVisible();

    await page.getByRole("button", { name: "Svenska" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("En bock om dagen. Bryt inte kedjan.");
    await expect(page.getByText("7 dagar i rad 🎉")).toBeVisible();
  });

  test("should open the terms and privacy policy without signing in", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("link", { name: "terms of use", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Terms of use" })).toBeVisible();
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { level: 1, name: "Privacy policy" })).toBeVisible();
  });

  test("should keep a protected page behind sign-in", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  });

});

test.describe("Signing out", () => {
  test("should sign out from the account menu", async ({ signedIn: page }, testInfo) => {
    await page.getByRole("button", { name: "Account menu" }).click();
    await expect(page.getByText(credentials(testInfo.project.name).email)).toBeVisible();
    await page.getByRole("button", { name: "Log out" }).click();

    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  });
});
