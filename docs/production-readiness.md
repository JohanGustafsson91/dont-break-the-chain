# Production readiness plan

Goal: release Don't Break The Chain publicly, with Google sign-in alongside GitHub.

This document records the decisions taken, what the codebase looks like today, and
the work needed before launch, split into reviewable pull requests. It is a plan,
**not legal advice**.

> **Deploy model: every merge to `main` goes live.**
> `.github/workflows/deploy.yml` deploys each push to `main` to the public app at
> `https://dont-break-the-chain-cb8a0.web.app`. "Launch" is therefore not a separate
> step, so the PRs below are ordered so that nothing goes live before what it depends
> on. For example, the privacy policy ships before Google sign-in.

## Decisions

| Topic | Decision |
|---|---|
| Firebase plan | Stay on **Spark** (free). Billing is currently off on the production project. Revisit Blaze when backups, notifications or blocking auth functions are needed, and delete the leftover functions first (see PR 1). |
| Environments | A **separate dev Firebase project**, configured like production but holding **no copied user data**. |
| Sign-in | **GitHub and Google.** Accounts are never merged on purpose. If the email already belongs to an account using the other provider, the user is told to sign in with that provider. One exception Firebase controls is described in [PR 3](#pr-3-google-sign-in). |
| Data controller | The app owner, as a private individual. The terms limit liability as far as the law allows (see [Legal](#legal-content)). |

## Current state

Findings from the codebase as of `main` @ `c4a6fa9`, verified by an independent review.

### Blockers

1. **Firestore security rules are unknown and not version-controlled.**
   - `firestore.rules` denies everything, but `firebase.json` has no `firestore` section, so the file is never deployed.
   - The live rules exist only in the Firebase console.
   - The client relies entirely on those rules: `getHabitById`, `updateHabit` and `deleteHabit` in `src/services/habitService.ts` do not check ownership.
   - If the live rules are the common `request.auth != null`, **any signed-in user can read, change and delete every user's habits and notes**.
2. **Development and production share one database.**
   - `.firebaserc` maps both `default` and `production` to `dont-break-the-chain-cb8a0`, and both `.env.*.local` files point to the same project.
   - `pnpm dev` therefore reads and writes production data.
3. **CI can read all user data, and unreviewed code can reach CI.**
   - The deploy workflow authenticates with an **admin** service account (`firebase-adminsdk-…`), which bypasses security rules. It authenticates *before* the build, so any dependency or build plugin can read the credentials.
   - Dependabot PRs are auto-merged with `exclude: none`, which includes major versions and GitHub Actions updates.
   - The reusable workflows are pinned to `@main` of another repository.
   - Together this is a supply-chain path to every user's data.
4. **No privacy policy, terms or account deletion.**
   - The app stores personal data: name, email and avatar in Firebase Auth, plus habits and free-text notes.
   - Habit names alone can reveal health information, for example "no alcohol" or "take medication".

### Other findings

- **Many failures are silent.** They are only logged with `console.error`:
  - login (`Login.tsx`)
  - creating, fetching and updating habits (`HabitsList.tsx`). A failed fetch shows an empty list, which looks like lost data.
  - rolled-back saves in the detail view
- **No error boundary.** A render error leaves a blank page.
- **Third parties are contacted before sign-in.**
  - `index.html` loads Google Fonts from `fonts.googleapis.com`, which sends visitors' IP addresses to Google. A German court found this unlawful without consent (LG München, 2022).
  - Avatars load from GitHub's and Google's servers.
- **Analytics is configured but never initialised.** `measurementId` is set but `getAnalytics` is never called. Keep it that way, so no consent banner is needed.
- **Secrets are not committed.** The service account JSON and `.env.*.local` are git-ignored and absent from history. The Firebase web config is public by design.
- **Stray files.**
  - Untracked `functions/` (compiled scheduled reminder functions that use `firebase-admin`) and `apphosting.yaml`.
  - `firebase.json` sets no-cache on `/service-worker.js`, but VitePWA emits `sw.js`, so the header has no effect.
- **No security headers on hosting.** `X-Content-Type-Options`, `Referrer-Policy` and `frame-ancestors` are all missing.
- **Polish:**
  - New habits are named with a raw ISO timestamp.
  - `README.md` is the Vite template.
  - `public/site.webmanifest` ("DBTC") and the VitePWA manifest ("Don't break the chain") disagree, and both ship.
- **Concurrent writes can overwrite each other.** Each habit stores its whole `streak` array in one document, so edits from two devices at once can overwrite each other (last write wins). This is accepted for launch and documented as a known limitation.
- **Spark quotas are shared.** About 50k reads and 20k writes per day across all users. A buggy or abusive client can exhaust them, and the app then stops working until the daily reset. Budget alerts are **not available on Spark**, because they need a billing account.

**Rate limiting (analysed 2026-10-09)**
- **Spark is the cost cap.** Abuse can make the app unavailable until the daily reset, but it can never cost money. That is the main reason to stay on Spark.
- **Throttling in the security rules was rejected.** Rules have no counters across requests, so throttling would need a "last write" timestamp per user that every write must update. That conflicts with fast taps in the calendar, and an attacker with a valid token could still burn the read quota, because rules cannot limit reads that way.
- **App Check is the main defence** (PR 5b). It rejects requests that don't come from the real app, which stops scripts that reuse the public web config. It doesn't stop a determined user scripting the real app in a browser, or replaying a token taken from it until the token expires (a longer token lifetime makes that window longer); at this scale that is accepted.
- **Hosting has a transfer limit of 360 MB per day** on Spark. Hashed assets are cached for a year (PR 5b), so returning visitors mostly hit their browser cache and the service worker.

## Work plan

The pull requests below, in this order. Steps marked **(owner)** are done by hand in the
Firebase, Google Cloud or GitHub consoles. Code changes cannot do them.

### PR 1: Lock down data, CI and environments

This PR protects existing users' data, not just future ones, so it goes first.

**Owner steps, before merging**
- [x] **Check the live Firestore rules.** Done on 2026-10-04:
  - The live rules are already owner-only for habits (default deny, read/write only when `author == uid`), so **no user could read other users' data, and no breach notification is needed**.
  - What the new rules add: `author` can no longer be changed, and field types and sizes are validated.
  - The live rules also allow writes to `fcmTokens`, a leftover from an unmerged notifications branch (December 2025). The new rules deny that collection.
- [x] **Clean up the notifications leftovers.** Checked on 2026-10-04:
  - `fcmTokens` holds no documents.
  - `morningReminder` and `eveningReminder` (v2, scheduled) are still deployed from a period when billing was enabled. On Spark they **cannot run and cannot cost anything**. They also **cannot be deleted**, because deleting their Cloud Scheduler jobs needs billing.
  - Decision: leave them. ⚠️ **If the project ever moves to Blaze, delete them first** (`firebase functions:delete morningReminder eveningReminder --region us-central1 -P production`), or their schedules start running again.
- [x] **Sample production documents.** Read-only audit on 2026-10-04: 2 users and 4 habits. Every habit has a valid `author`, and nothing exceeds the new limits. 3 habits lack `goal`, which the rules handle.
- [ ] **Least-privilege deploy account.**
  - Create a service account with only *Firebase Hosting Admin*, *Firebase Rules Admin* and *Service Usage Consumer* (the CLI checks that APIs are enabled), or use Workload Identity Federation.
  - `firebase.json` deploys rules but no indexes, so these roles are enough. Index deploys would need *Cloud Datastore Index Admin* as well.
  - Before switching CI over, test the key: `GOOGLE_APPLICATION_CREDENTIALS=key.json pnpm exec firebase deploy --only firestore:rules -P production --dry-run`.
  - Replace the `FIREBASE_SERVICE_ACCOUNT` secret with it.
  - Revoke the admin key from CI.
- [ ] **Branch protection on `main`:** the CI checks must pass before merging.
- [x] **Create the dev Firebase project.** Done: `dont-break-the-chain-dev-a6si`.
  - Firestore is in `eur3`, the same location as production.
  - A web app is registered, and its config is in `.env.development.local`.
  - The rules from this PR are deployed to it.
- [ ] **Enable sign-in in dev** (console only):
  1. Authentication → Get started.
  2. Create a **new GitHub OAuth app** (GitHub → Settings → Developer settings → OAuth Apps) with the callback `https://dont-break-the-chain-dev-a6si.firebaseapp.com/__/auth/handler`.
  3. Sign-in method → GitHub → paste its client id and secret.
  4. Do not copy production data into dev.
- [x] Once dev works, **remove `localhost` from production's authorized domains.** Checked on 2026-10-09: production allows only its `firebaseapp.com` and `web.app` domains.

**Code**
- **Rules**, ownership first and validation kept compatible with older data:
  - Read and delete only when `resource.data.author == request.auth.uid`.
  - Create only for oneself. A new habit must have the expected fields with the right types.
  - Update only by the owner. `author` cannot change, and only `name`, `description`, `goal` and `streak` may change, each validated by type and size.
  - Updates are validated per changed field (`diff().affectedKeys()`), not on the whole document, so older documents with other fields stay editable.
  - Rules cannot loop over lists. They cap the *number* of streak entries generously (several years of daily entries), but cannot validate each entry or the length of each note. The 1 MiB document limit is the final cap. Per-entry limits belong in the client.
  - List queries are allowed only when they filter on the caller's own `author`, as `getAllHabits` already does.
- `firebase.json`: add a `firestore` section and emulator settings. Fix the no-cache header path to `sw.js`.
  - It deploys rules only. `firestore.indexes.json` is empty, and index deploys need an extra IAM role.
- App changes the rules make necessary:
  - `addHabit` and `getAllHabits` refuse to run without a signed-in user, instead of falling back to `author: ""`.
  - Opening another user's or a deleted habit now gets `permission-denied`. The detail view shows "This habit doesn't exist, or it isn't yours" instead of hanging.
  - The name and description inputs get `maxLength` 200 and 2000, matching the rules, so edits are never silently rejected.
- `deploy.yml` uses the pinned `firebase-tools` from devDependencies instead of a global, unpinned install.
- `.firebaserc`: `default` and `dev` point to `dont-break-the-chain-dev-a6si`, and `production` to `dont-break-the-chain-cb8a0`. Plain `firebase deploy` and `make deploy` now target dev. Only `deploy:prod` (`-P production`) targets production.
- **Rules tests** with `@firebase/rules-unit-testing` against the Firestore emulator:
  - a separate `test:rules` script, not part of `pnpm test`, because it needs the emulator and Java
  - a separate CI job
- **CI:** Dependabot auto-merge excludes major updates (`exclude: major` in the toolkit workflow). That also covers GitHub Actions, which are pinned by major tag, so Dependabot only proposes major bumps for them. Majors are reviewed by hand.

**Done when**
- The rules tests pass in CI.
- `deploy:prod` deploys hosting and rules with the least-privilege account.
- After the owner has created the dev project: `pnpm dev` talks to the dev project. This can land after the merge.
- A manual check in production: a second test user cannot read user A's habit.

### PR 2: Legal pages and data minimisation

This must be live before Google sign-in, because Google's consent screen needs a privacy policy URL.

**Owner steps**
- [ ] Accept the Google Cloud/Firebase **data processing terms** (Project settings → Privacy) in both projects.
- [ ] Choose the published **controller identity**. GDPR art. 13 requires a name and a contact address. Consider a dedicated email address.
- [ ] Get the texts reviewed (see [Legal content](#legal-content)).

**Code**
- **Self-host the fonts** (DM Sans, Victor Mono) instead of loading them from Google Fonts.
- Add static pages `/privacy` and `/terms`, linked from the login page and, once signed in, from the account menu (PR 4). Until PR 4 they were in a small footer on the home screen.
- **Accepting the terms at sign-in:**
  - An **explicit checkbox** next to the sign-in buttons: "I accept the terms of use and have read the privacy policy". The privacy policy is information, not something to accept, because the legal basis is the contract, not consent. A checkbox is stronger than a notice saying that signing in means accepting.
  - The checkbox is only a gate in the browser: nothing is stored. ❓ If the legal review finds that explicit consent for health-related data (art. 9(2)(a)) is needed, that needs a separate, specific statement, plus a stored record of when it was given and for which policy version.

**Done when**
- The pages are live and linked.
- No third-party requests happen before sign-in, except Firebase Auth.

### PR 3: Google sign-in

**Owner steps, per project (dev and production)**

> ⚠️ Do these in **production before merging.** Every merge deploys, and the PR ships a "Continue with Google" button that fails with a generic error until the provider is enabled.

- [ ] Enable the Google provider.
- [ ] Configure the OAuth consent screen: app name, support email, the privacy policy URL from PR 2 and authorized domains. Basic profile and email scopes need no Google verification. Don't upload a logo, because that triggers Google's brand verification.
- [ ] Keep **"One account per email address"** (Authentication → Settings → User account linking). This is the default.
- [ ] If `authDomain` changes to the hosting domain or a custom domain (see below):
  - Set the GitHub OAuth app's callback to `https://<domain>/__/auth/handler`. A GitHub OAuth app allows only one callback URL.
  - Add that URI to the Google OAuth client.
  - Add the domain to the authorized domains.

**Code**
- Add `GoogleAuthProvider` to `login()` (`src/services/authService.ts`), and a "Sign in with Google" button.
- When an email is already linked to the other provider, Firebase rejects the sign-in with `auth/account-exists-with-different-credential`.
  - Show: *"An account with this email already exists. Sign in with GitHub instead."* (or Google). Never link automatically.
  - With only two providers, the other one can be inferred. Do not use `fetchSignInMethodsForEmail`: it is deprecated and returns nothing when email enumeration protection is on.
- Show visible messages for popup closed, popup blocked and network errors.
- Popup or redirect:
  - Popups are unreliable in iOS Safari and in installed PWAs.
  - Redirect sign-in needs `authDomain` on the same site as the app, because browsers block third-party storage.
  - Decide after testing the matrix below.

**Known Firebase behaviour: decided, option (a)**

Google is a *trusted* provider for `@gmail.com` addresses, and GitHub emails are treated as unverified. So with one account per email:
- **Google first, then GitHub with the same email:** the error appears and the message is shown, as intended.
- **GitHub first, then Google with the same Gmail address:** Firebase most likely signs the user in to the **same account (same UID, habits intact) and unlinks GitHub.** GitHub sign-in stops working for that user. No data is lost, but the user is not told.

On Spark this cannot be blocked: preventing it needs blocking auth functions, which require Blaze.

**Decided (2026-10-08): option (a).** The owner accepts that Google takes over in this case, because the data stays intact. The options were:
- **(a, recommended)** Accept it and document it. The user simply continues with Google, and their data is unaffected.
- **(b)** Use "multiple accounts per provider". This never merges and never shows an error, but the user then gets two separate, empty-vs-full accounts, which is worse.
- **(c)** Move to Blaze and use a `beforeSignIn` blocking function to reject the sign-in.

Confirm the behaviour in dev, with a GitHub account whose email is a Gmail address, and record the result in the PR.

**Test matrix** (both providers × device × context): desktop browser, iOS Safari, iOS installed PWA, Android Chrome, Android installed PWA.

**Done when**
- Every cell in the matrix signs in successfully.
- The same-email cases behave as documented.

### PR 4: Export and delete

**Code**
- An account menu behind the avatar in the app bar, on every signed-in page. It holds Export my data, Delete my account, Privacy policy, Terms of use and Log out. This meets GDPR art. 12's "easily accessible" requirement without permanent footer links.
- **Export my data:** a JSON download with the Auth profile (id, name, email, picture link, providers, account creation and last sign-in time) and all of the user's habits, including when each was created.
- **Delete my account**, in an order that can be safely retried:
  1. Re-authenticate first (`reauthenticateWithPopup`/`Redirect` with the user's provider), because Firebase requires a recent sign-in.
  2. Delete all of the user's habit documents.
  3. Delete the Firebase Auth user.

  If step 3 fails, the user is still signed in with an empty account and can retry. This works on Spark without Cloud Functions.

**Done when**
- Export contains the profile and all habits.
- Deletion removes all Firestore data and the Auth user. Not covered, and stated in the policy: the provider's own record and OAuth grant, and Google's logs.
- Known gap: another device that stays signed in keeps a valid token for up to about an hour, and could create a habit after the deletion query. Such a document is unreachable from the app. Purge it manually in the console (query `author == <uid>`) if a deleted user reports it. Closing this fully needs the Admin SDK (Blaze).
- A failure at any step leaves a state the user can retry.

### PR 5a: Robustness (done, #70)

- A top-level error boundary with a friendly message and a reload button.
- A small toast system, used for every silent failure listed above: fetch, create, mark day, goal, name/description, delete and export.
- Terms acceptance is remembered per device and per terms version.
- Error monitoring (Sentry or similar) is deferred. At launch traffic, the error boundary and the browser console are enough, and leaving it out avoids another data processor.

### PR 5b: App Check and caching

**Decided 2026-10-09: App Check waits.** The code is in place but stays off until a site key is added. reCAPTCHA sends device and browser data to Google on every visit, may set a cookie and shows a badge, while the risk it addresses (someone deliberately exhausting the free quota) is low and can never cost money on Spark. Turn it on if there are signs of abuse, or after the lawyer has answered the reCAPTCHA question below.

**Owner steps (when turning it on)**
- [ ] First update the privacy policy: reCAPTCHA (Google) as a recipient of device and browser data on every visit, its purpose and legal basis (art. 6(1)(f)), the US transfer and the cookie. Adjust "never shared for their own purposes" and "no automated decision-making". Bump the effective date.
- [ ] Register a **reCAPTCHA v3** site key for each project (dev and production) in the Firebase console under App Check, with the app's domains. Classic reCAPTCHA keys now live in Google Cloud; the free tier covers about 10,000 assessments per month. Raise the App Check token lifetime in the console (for example to 1 day) so that each visitor needs fewer assessments; the trade-off is a longer replay window for a stolen token. Check what happens past the free tier without billing, since App Check could start failing exactly when the app is under attack.
- [ ] Put the dev key in `.env.development.local` as `VITE_APPCHECK_SITE_KEY`, and add a GitHub secret `VITE_APPCHECK_SITE_KEY` with the production key in the `production` environment.
- [ ] For local development, register the debug token that the browser console prints on first run (or set `VITE_APPCHECK_DEBUG_TOKEN`).
- [ ] Watch the App Check metrics for one release in monitoring mode, then **enforce** App Check for Firestore and Authentication. Test Google and GitHub popup sign-in on dev with enforcement on first.
- [ ] Make the production build fail when `VITE_APPCHECK_SITE_KEY` is empty, since an enforced App Check rejects every request from a build without it.

**Code**
- Initialise App Check in `firebaseService.ts` when a site key is set; dev builds use a debug token instead of reCAPTCHA.
- Fix `pnpm deploy` (dev Hosting): it built in production mode and so shipped the **production** Firebase config to the dev site. It now builds with `--mode development`, which reads `.env.development.local`.
- Cache hashed assets (`/assets/**`) for a year as immutable.

**Done when**
- App Check metrics show the app's traffic as verified, and enforcement doesn't break sign-in or saving.
- The cache header is live.

### PR 6: Launch hygiene

**Owner steps**
- [ ] Decide between the `web.app` URL and a custom domain (affects `authDomain`, see PR 3).
- [ ] Check usage in the Firebase console regularly. Set budget alerts if the project moves to Blaze.

**Code**
- Security headers in `firebase.json`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` and `Content-Security-Policy: frame-ancestors 'none'`. Checked on dev: Hosting's reserved `/__/auth/` paths don't get them, so the sign-in iframe on `firebaseapp.com` still works.
- Stray files:
  - The untracked `functions/` folder was moved out of the repository.
  - `apphosting.yaml` and the duplicate `public/site.webmanifest` were removed.
- Deploy safety:
  - A predeploy check refuses to deploy a build made for the other Firebase project.
  - `make deploy` goes through `pnpm run deploy`.
  - CI authenticates only after the build (see PR 1).
- Polish:
  - New habits are named "New habit", and the name is selected when the habit opens. On iPhone the keyboard doesn't open by itself, because iOS only allows that directly after a tap.
  - There is one manifest, named "Don't Break The Chain", with "DBTC" as the label under the home screen icon (also on iOS).
  - Links inside text are underlined, and a `robots.txt` was added.
- Lighthouse on the dev login page (2026-10-09):
  - Mobile: Performance 91, Accessibility 95, Best Practices 100, SEO 91.
  - Desktop: Performance 100, Accessibility 95, Best Practices 100, SEO 91.
  - Lighthouse 12 no longer has a PWA category.
  - What's left is mostly Google's and Firebase's own scripts, plus unused JavaScript that would need code splitting.
- `README.md`: what the app is, how to set up dev and run the emulator tests, how deployment works, and the known limitations.

### PR 7 and 8: Daily reminders (decided 2026-10-09)

Push reminders that work on Spark, without Cloud Functions: a scheduled GitHub Actions workflow sends them through Firebase Cloud Messaging (FCM), which is free.

**PR 7: The app side**
- Reminder settings in the account menu: on/off and the hour of the day. The browser's IANA time zone is saved with it, so "20:00" means 20:00 where the user is.
- One `reminders/{uid}` document per user: the hour, the time zone, one FCM token per device, and `lastMarkedDate`, which the app updates when today is marked so that users who are done get no reminder.
- Switch VitePWA to `injectManifest`, so the service worker can show push notifications.
- Security rules and rules tests for `reminders`: owner-only, with field validation. Account deletion also deletes the reminders document.
- Privacy policy: the FCM token and the reminder settings, and Google (FCM) as a processor.

**PR 8: The sender**
- A workflow that runs every hour. It finds users whose chosen hour has just started in their time zone and who haven't marked today, and sends one notification per device. Tokens that FCM reports as invalid are removed.
- It authenticates with **Workload Identity Federation**, without a stored key. Firestore IAM roles cover the whole database and server credentials bypass the security rules, so the service account (`roles/datastore.user` plus FCM send) can technically read every habit. The script only touches `reminders`, and Workload Identity limits who can use the account to this repository's workflow on `main`.

**Limitations**
- On iPhone, push works only when the app is installed on the home screen (iOS 16.4 or later).
- GitHub can delay scheduled runs by several minutes, so reminders are approximate.
- In a public repository, GitHub turns off scheduled workflows after 60 days without repository activity. Re-enabling the workflow, or a periodic keep-alive, is needed.
- Each run reads the reminders documents, which counts against the shared Spark read quota (24 runs a day times the number of users with reminders on).

## Legal content

What the texts should cover, in plain language. A short review by a lawyer, or a reputable GDPR template service, is recommended before launch. **Specific questions for that review are marked ❓.**

**Privacy policy (required by GDPR art. 13)**
- **Controller:** the owner's name and a contact email.
  - ❓ Is an email address enough as contact details, or is a postal address needed? The e-commerce act's address requirement applies to paid services, so it is probably not needed here.
- **What is stored:**
  - the name, email and avatar from the sign-in provider
  - habits, daily statuses and notes
- **Why it is stored:**
  - to provide the service (art. 6(1)(b), performance of a contract)
  - ❓ Habit names and notes may reveal health data (art. 9), which art. 6(1)(b) does not cover. Is explicit consent (art. 9(2)(a)) at sign-up needed, and what form should it take?
- **Recipients and processors:**
  - Google: Firebase Auth, Firestore and Hosting, and reCAPTCHA once App Check is turned on
  - ❓ reCAPTCHA v3 runs on every visit and may set a cookie. Is it "strictly necessary" under the Swedish electronic communications act (LEK 9:28), so that no consent is needed? The policy currently says no consent is needed; revisit it after the answer. Google is an independent controller for reCAPTCHA data. Is a legitimate-interest basis enough for that? And does reCAPTCHA's risk score count as profiling or automated decision-making (art. 22) once App Check is enforced?
  - GitHub or Google: the sign-in provider the user chooses
- **Transfers:** Firebase Auth processes data in the US. Transfers rely on the EU-US Data Privacy Framework and Standard Contractual Clauses. Check and state the Firestore location (it is `eur3`).
  - ❓ Firebase Hosting serves the app from a global CDN, which sees visitors' IP addresses. Does that need to be mentioned as a transfer?
- **Retention:** until the user deletes their account.
- **Rights:** access and export, correction, deletion, and the right to complain to IMY.
- **No tracking:** no analytics, advertising or data selling. Sign-in uses only strictly necessary local storage.

**Terms of use (where the liability limits live)**
- **Minimum age:** 13, which matches GitHub's and Google's age limits and the Swedish age of digital consent.
  - ❓ That age comes from GDPR art. 8, which is about consent, while the legal basis here is a contract. Under föräldrabalken ch. 9, minors generally cannot enter binding contracts. Is the basis sound for users aged 13–17?
- **"As is":** the service is free and provided "as is" and "as available", without warranties of availability, continuity or data retention. Users should export what matters to them.
- **No advice:** it is not medical, health or professional advice.
- **Liability:** excluded **to the extent permitted by applicable law**.
- **Changes:** the service may change or shut down at any time.
- **Applicable law:** Swedish law. Consumers in other EU countries keep the mandatory protection of their own law (Rome I art. 6).

**What the terms cannot do**
- In the EU, terms cannot exclude GDPR obligations, liability for intent or gross negligence, or mandatory consumer rights.
- A request like "please don't enter health information" does not change the controller's obligations if such data is stored anyway.
- What actually protects the owner is:
  - collecting little data
  - correct security rules (PR 1)
  - working export and deletion (PR 4)
  - a policy that matches what the app really does

## Pre-launch checklist

- [ ] The live production rules match `firestore.rules`, and the rules tests pass in CI.
- [ ] CI deploys with a least-privilege account, and Dependabot no longer auto-merges majors or Actions updates. Branch protection is on.
- [x] Dev and production are separate projects, and `localhost` is removed from production's authorized domains.
- [ ] The privacy policy and terms are live, and acceptance is an explicit checkbox. The fonts are self-hosted.
- [ ] Every cell of the sign-in test matrix passes. The same-email behaviour matches the documentation.
- [ ] Export and account deletion work, including re-authentication and retry.
- [ ] The error boundary and failure messages work. App Check is enforced, or consciously deferred (it is, see PR 5b).
- [ ] Security headers are set, stray files are removed, and the Lighthouse thresholds are met. The README is written.

## Out of scope for launch

- **Backups.** Spark has none. Users can export their data. Revisit on Blaze: scheduled exports or point-in-time recovery.
- **Conflict-free concurrent edits**, for example one document per day or field-level updates.
- **Offline writes** (Firestore persistent cache).
- **Error monitoring service** (see PR 5a).
- **Localisation.** The UI is English only.

## Open questions

1. What do the live production rules look like today? This is the first owner step of PR 1.
2. ~~Gmail and GitHub with the same address (PR 3): is option (a) acceptable?~~ Decided on 2026-10-08: yes. It is disclosed in the privacy policy.
3. Which name and contact email should be published as the controller?
4. Is there a custom domain? The answer affects `authDomain` and the OAuth callbacks.
