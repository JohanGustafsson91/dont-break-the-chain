// The test-only hook from src/e2e/testHooks.ts, as seen from the tests.
interface Window {
  __e2e?: {
    signIn: (email: string, password: string) => Promise<void>;
    whenSignedIn: () => Promise<boolean>;
    reset: () => Promise<void>;
    waitForWrites: () => Promise<void>;
    seedReminder: () => Promise<void>;
  };
}
