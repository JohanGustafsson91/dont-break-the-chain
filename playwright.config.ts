import { existsSync, readFileSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// End-to-end tests: the app as built from this branch, served locally, against the
// real dev Firebase project. Each browser has its own test account: E2E_EMAIL and
// E2E_PASSWORD for Chromium, E2E_WEBKIT_EMAIL and E2E_WEBKIT_PASSWORD for WebKit
// (GitHub secrets in CI, or .env.e2e.local on your machine).
if (existsSync(".env.e2e.local")) {
  for (const line of readFileSync(".env.e2e.local", "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
  }
}

const PORT = 4173;

// Desktop Chromium, and Safari's engine on a phone, where most real-world bugs have been.
const BROWSERS = {
  "desktop-chromium": devices["Desktop Chrome"],
  "mobile-webkit": devices["iPhone 14"],
};

export default defineConfig({
  testDir: "e2e",
  // One test account, so tests must not run at the same time.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    // A test build is not the app users install; keep the service worker out of it.
    serviceWorkers: "block",
    // Never in CI: traces record request bodies and evaluate arguments (the test
    // password, session tokens), and a public repo's artifacts are downloadable by anyone.
    trace: process.env.CI ? "off" : "retain-on-failure",
    screenshot: "only-on-failure",
  },
  // Each browser signs in once in its setup project; its tests reuse that session.
  projects: Object.entries(BROWSERS).flatMap(([name, device]) => [
    { name: `setup-${name}`, testMatch: /auth\.setup\.ts/, use: device },
    {
      name,
      use: { ...device, storageState: `playwright/.auth/${name}.json` },
      dependencies: [`setup-${name}`],
    },
  ]),
  webServer: {
    // `--mode development` reads .env.development.local (the dev project); CI passes
    // the same values as environment variables.
    command: `pnpm exec vite build --mode development --outDir dist-e2e && pnpm exec vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    env: { VITE_E2E: "true" },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
