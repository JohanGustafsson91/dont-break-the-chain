import { test, expect } from "./fixtures";

test.describe("Signed out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("should ask to accept the terms before any sign-in button works", async ({ page }) => {
    await page.goto("/login");

    const google = page.getByRole("button", { name: "Continue with Google" });
    const github = page.getByRole("button", { name: "Continue with GitHub" });
    await expect(google).toBeDisabled();
    await expect(github).toBeDisabled();

    await page.getByRole("checkbox").check();
    await expect(google).toBeEnabled();
    await expect(github).toBeEnabled();
  });

  test("should open the terms and privacy policy without signing in", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("link", { name: "terms of use" }).click();
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
  test("should sign out from the account menu", async ({ signedIn: page }) => {
    await page.getByRole("button", { name: "Account menu" }).click();
    await expect(page.getByText(process.env.E2E_EMAIL!)).toBeVisible();
    await page.getByRole("button", { name: "Log out" }).click();

    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  });
});
