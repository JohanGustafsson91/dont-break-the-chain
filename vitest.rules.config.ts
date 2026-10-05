import { defineConfig } from "vitest/config";

// Security rules tests need the Firestore emulator, so they run separately:
// `pnpm test:rules` starts the emulator and runs this config.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.rules.test.ts"],
  },
});
