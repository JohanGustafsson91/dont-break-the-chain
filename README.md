# Don't Break The Chain

A small, free habit tracker. Mark each day as done (✓) or missed (✗), and keep the
chain of good days going. Live at https://dontbreakthechain.se.

- Daily habits, or weekly goals such as "3 times a week"
- A calendar with notes per day, current and longest streaks, and a year overview
- Short insights from your history, such as which weekday you miss most often
- Sign in with Google or GitHub; export your data or delete your account from the account menu
- Installable as an app (PWA)

## Stack

React 19, TypeScript and Vite, with `vite-plugin-pwa`. Firebase Authentication,
Cloud Firestore and Firebase Hosting, on the free Spark plan. Tests use Vitest and
Testing Library; the Firestore security rules are tested against the emulator.

## Getting started

You need Node 20+, pnpm 9, and Java 21 for the Firestore emulator. To run the app
against Firebase you also need access to the dev Firebase project; ask the owner.

```sh
pnpm install
pnpm exec firebase login
```

Create `.env.development.local` with the web config of the **dev** Firebase project
(Project settings → Your apps):

```sh
VITE_API_KEY=…
VITE_AUTH_DOMAIN=…
VITE_PROJECT_ID=…
VITE_STORAGE_BUCKET=…
VITE_MESSAGING_SENDER_ID=…
VITE_APP_ID=…
VITE_MEASUREMENT_ID=…
```

`VITE_FCM_VAPID_KEY` (the project's Web Push public key) turns on daily reminders.
`VITE_APPCHECK_SITE_KEY` and `VITE_APPCHECK_DEBUG_TOKEN` are optional, and unused
while App Check is off.

Then run `pnpm dev`. Sign-in works on `localhost`, which is an authorized domain in
the dev project only. Setting up the sign-in providers for a new project is described
in `docs/production-readiness.md` (PR 3).

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server against the dev project |
| `pnpm test` | Unit and component tests |
| `pnpm test:rules` | Security rules tests in the Firestore emulator (offline, no login or config needed) |
| `pnpm test:e2e` | End-to-end tests in a real browser, against the dev project (see below) |
| `pnpm lint` | ESLint |
| `pnpm run deploy` | Tests, builds for dev and deploys hosting and rules to the **dev** project |

Use `pnpm run deploy`, not `pnpm deploy`, which is a built-in pnpm command.

## End-to-end tests

Playwright runs the app built from your branch, served on `localhost`, against the
**dev** Firebase project, in desktop Chromium and mobile WebKit (Safari's engine). They
run on every pull request ("End-to-end tests" workflow).

- They sign in to a test account with email and password, which only the dev project
  allows. The app has no UI for that: a test-only hook (`src/e2e/testHooks.ts`) is
  included only when `VITE_E2E=true`, never in a normal build.
- Each browser has its own test account, so CI runs Chromium and WebKit side by side.
  Locally, put them in `.env.e2e.local` (git-ignored): `E2E_EMAIL`, `E2E_PASSWORD`,
  `E2E_WEBKIT_EMAIL` and `E2E_WEBKIT_PASSWORD`. In CI they are secrets with the same
  names, and the dev web config comes from `DEV_VITE_*` variables.
- Each browser signs in once and the tests reuse that session; every test starts by
  deleting the account's habits. Runs of the same browser never overlap.
- The report uploaded when CI fails has screenshots but no traces: traces would contain
  the test password and session, and anyone can download a public repo's artifacts.
- Firebase limits sign-ins and session restores per IP. Running the whole suite many
  times in a row locally can get throttled (pages hang on "Loading"); wait a while.

## Environments and deployment

| | Project | Deployed by |
| --- | --- | --- |
| Dev | `dont-break-the-chain-dev-a6si` | `pnpm run deploy`, by hand |
| Production | `dont-break-the-chain-cb8a0` | GitHub Actions, on every merge to `main` |

Daily reminders are sent by `scripts/send-reminders.mjs`, which the "Send daily reminders"
workflow runs every hour against production. A small Cloudflare Worker
(`cloudflare/reminder-trigger`) starts it on time, since GitHub's own schedule skips runs. It signs in with Workload Identity
Federation, so no key is stored anywhere. `DRY_RUN=1` shows who would get a reminder
without sending anything.

- `firebase deploy` without `-P` targets dev, unless you have run `firebase use` to pick another project.
- Production deploys use a least-privilege service account and the `production`
  environment's secrets.
- A predeploy check (`scripts/check-build-target.mjs`) refuses to deploy a build that
  was made for the other project.
- Pull requests need the "Firestore rules" and "Validate PR / Lint, Test & Build" checks to pass.

## Known limitations

- **Last write wins.** Each habit is one document, so editing the same habit on two
  devices at the same moment can overwrite one of the edits.
- **Shared free quotas.** On Spark, all users share about 50k reads and 20k writes a
  day. If they run out, the app stops working until the daily reset; it never costs money.
  App Check is prepared but turned off (see the plan).
- **No backups.** Users can export their data from the account menu.
- **English only.**

## More

`docs/production-readiness.md` has the launch plan, the decisions behind it, the
legal content and the open questions.
