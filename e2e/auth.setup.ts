import { test as setup, expect } from "@playwright/test";
import { authFile, credentials } from "./fixtures";

// Signs in once per browser and saves the session (Firebase keeps it in IndexedDB).
// Firebase limits password sign-ins, so the tests reuse this instead of each signing in.
setup("sign in to the test account", async ({ page }, testInfo) => {
  const { email, password } = credentials();
  await page.goto("/login");
  await page.waitForFunction(() => window.__e2e !== undefined);
  await page.evaluate(({ email, password }) => window.__e2e!.signIn(email, password), { email, password });
  await expect(page.getByRole("heading", { name: "Your habits" })).toBeVisible();
  await page.context().storageState({ path: authFile(testInfo.project.name), indexedDB: true });
});
