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
under [Operations](#operations).

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

- They sign in to a test account with email and password in the dev project. The
  accounts' addresses can't receive mail, so they're marked as verified with the Admin
  API (`accounts:update`, `emailVerified: true`); a new test account needs the same, or
  the rules keep it out. Setup signs in through a test-only hook
  (`src/e2e/testHooks.ts`), included only when `VITE_E2E=true`, never in a normal build.
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
  App Check is prepared but turned off (see [Operations](#operations)).
- **No backups.** Users can export their data from the account menu.
- **Two languages.** English and Swedish; the app follows the browser unless the user
  picks one.

## Operations

**Sign-in providers, per Firebase project** (Authentication → Sign-in method):
- **Google:** enable it and fill in the OAuth consent screen (app name, support email,
  privacy policy URL, authorized domains). Don't upload a logo: it triggers Google's
  brand verification.
- **GitHub:** a GitHub OAuth app per project, with the callback
  `https://<authDomain>/__/auth/handler` (one callback per app). Production's
  `authDomain` is `dontbreakthechain.se`.
- **Email/Password:** enable the first option only ("Email link" isn't needed; on Spark
  it allows 5 emails a day). Keep **email enumeration protection** on (Authentication →
  Settings → User actions), so sign-in and password reset never tell which emails have
  an account; sign-up can't hide it. The firestore rules keep password accounts out of
  all data until the email is verified (the app shows "Check your inbox"); otherwise
  someone could register another person's Gmail address first and share the account
  when that person later signs in with Google. Optionally set the email templates'
  sender name in Authentication → Templates.
- Keep **one account per email address** (Authentication → Settings), the default.
  Signing in with the other provider for the same email then shows "Sign in with
  GitHub/Google instead". One exception, accepted on purpose: Google is trusted for
  Gmail addresses, so a GitHub or unverified password account with a Gmail address is
  taken over by Google sign-in (same account, habits intact, the earlier sign-in stops
  working). Preventing it needs blocking functions, which need the Blaze plan.

**Daily reminders:**
- The Cloudflare Worker starts the workflow at :02 every hour with a fine-grained
  GitHub token (Actions: read and write, this repository only). GitHub's own schedule
  at :07 is the backup; a second run sends nothing extra. Renew the token before it
  expires.
- The workflow signs in to Google Cloud as the keyless service account
  `reminder-sender` (`roles/datastore.user`, `roles/firebasecloudmessaging.admin`)
  through the Workload Identity pool `github`, provider `reminders`. Only
  `.github/workflows/reminders.yml` on `main` of this repository (checked by repository
  and owner id) may use it. The repository variables `REMINDERS_WIF_PROVIDER` and
  `REMINDERS_SERVICE_ACCOUNT` point to them.
- Server credentials bypass the security rules, so anyone who can push to `main` can
  use the account. Require reviews before adding collaborators.
- Workflow logs are public: the sender logs counts only.
- Each run reads every reminders document (shared read quota). In a public repository
  GitHub turns off scheduled workflows after 60 days without activity; the Worker still
  starts it.
- On iPhone, push works only in the app installed on the home screen (iOS 16.4+).

**Unverified accounts** are deleted once a day by `scripts/delete-unverified.mjs`
("Delete unverified accounts" workflow): email-and-password accounts whose address
wasn't verified within 7 days. They can't hold any data (the security rules require a
verified address), so only the account goes. Google, GitHub, verified and linked
accounts are never touched, and a run stops without deleting anything if it finds more
than 50 (the run then fails, so GitHub emails the owner; raise `MAX_PER_RUN` if it's
real). A manual run is a dry run by default.

- It signs in as the keyless service account `account-cleaner` through the Workload
  Identity pool `github`, provider `cleanup`; only `cleanup.yml` on `main` of this
  repository may use it. Its custom role `accountCleaner` can only read and delete Auth
  users (`firebaseauth.users.get`, `firebaseauth.users.delete`). Set up once by the
  owner with `node scripts/setup/account-cleaner-identity.cjs`; the repository variables
  `CLEANUP_WIF_PROVIDER` and `CLEANUP_SERVICE_ACCOUNT` point to them.

**Backups** run in the private repository
[`dont-break-the-chain-backups`](https://github.com/JohanGustafsson91/dont-break-the-chain-backups),
private so not even the encrypted files are public. Once a day it reads the app's Firestore
collections (`habits`, `reminders`), encrypts them with `age` and keeps it as a workflow artifact for 30 days (the
retention the privacy policy promises). Firestore's own exports and backups need the
Blaze plan.

- It signs in as the keyless, read-only service account `backup-reader`
  (`roles/datastore.viewer`) through the Workload Identity pool `github`, provider
  `backups`; only `backup.yml` on `main` of that repository may use it.
- The public key is the repository variable `BACKUP_AGE_RECIPIENT`. The private key is
  kept only by the owner, outside both repositories: without it the backups can't be read.
- `restore.mjs` there writes a backup back, one user's data or everyone's, as a dry run
  unless `--apply` is given, and always skips users who have deleted their account since,
  as the privacy policy promises. See its README.

**App Check** is off on purpose: reCAPTCHA sends device data to Google on every visit,
and the risk (someone exhausting the free quota, including the daily verification and
password reset emails) can't cost money on Spark. Before
turning it on: name reCAPTCHA in the privacy policy (recipient, purpose, legal basis,
US transfer, cookie) and bump its effective date, register a reCAPTCHA v3 key per
project, set `VITE_APPCHECK_SITE_KEY` (dev env file and the `production` environment's
secrets), watch the metrics for a release, then enforce it for Firestore and Auth.
