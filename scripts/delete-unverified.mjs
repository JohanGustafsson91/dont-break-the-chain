// Deletes email-and-password accounts whose address was never verified, a week after
// they were created. Run once a day by .github/workflows/cleanup.yml.
//
// Such an account can't read or write any data (isTrustedUser in firestore.rules), so
// the account is all there is to delete. Google and GitHub accounts are never touched,
// and neither is an email account once it's verified or linked to another provider.
//
// Env: ACCESS_TOKEN, PROJECT_ID. Optional: DRY_RUN=1 (count, delete nothing), NOW.
// The repository and its workflow logs are public: log counts only.

import { pathToFileURL } from "node:url";

const DAY_MS = 24 * 60 * 60 * 1000;
export const GRACE_DAYS = 7;
// More than this in one day is far beyond normal sign-ups: more likely a bug, so stop
// rather than delete. Raise it by hand if it's ever real.
export const MAX_PER_RUN = 50;

/** Whether an account signed up with email and password and never verified it in time. */
export const isAbandoned = (user, now) => {
  const providers = (user.providerUserInfo ?? []).map((p) => p.providerId);
  const createdAt = Number(user.createdAt);
  return (
    user.emailVerified !== true &&
    providers.length > 0 &&
    providers.every((p) => p === "password") &&
    Number.isFinite(createdAt) &&
    now.getTime() - createdAt > GRACE_DAYS * DAY_MS
  );
};

export const deleteUnverified = async ({ api, now, dryRun }) => {
  const abandoned = [];
  let checked = 0;
  for await (const user of api.users()) {
    checked += 1;
    if (isAbandoned(user, now)) abandoned.push(user.localId);
  }

  const counts = { checked, abandoned: abandoned.length, deleted: 0, failed: 0 };
  if (abandoned.length > MAX_PER_RUN) {
    console.error(`Refusing to delete ${abandoned.length} accounts in one run (limit ${MAX_PER_RUN}).`);
    return { ...counts, failed: abandoned.length };
  }
  if (dryRun || abandoned.length === 0) return counts;

  const failed = await api.deleteUsers(abandoned);
  return { ...counts, deleted: abandoned.length - failed, failed };
};

const createApi = ({ accessToken, projectId }) => {
  const base = `https://identitytoolkit.googleapis.com/v1/projects/${projectId}`;
  const call = async (path, init = {}) => {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    });
    // The status only: an error body could include account details.
    if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path.split("?")[0]} → ${res.status}`);
    return res.json();
  };

  return {
    users: async function* () {
      let nextPageToken = "";
      do {
        const query = new URLSearchParams({ maxResults: "500", ...(nextPageToken && { nextPageToken }) });
        const page = await call(`/accounts:batchGet?${query}`);
        yield* page.users ?? [];
        nextPageToken = page.nextPageToken ?? "";
      } while (nextPageToken);
    },
    /** Deletes the accounts and returns how many failed. */
    deleteUsers: async (localIds) => {
      const { errors = [] } = await call("/accounts:batchDelete", {
        method: "POST",
        body: JSON.stringify({ localIds, force: true }),
      });
      return errors.length;
    },
  };
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { ACCESS_TOKEN, PROJECT_ID, DRY_RUN, NOW } = process.env;
  if (!ACCESS_TOKEN || !PROJECT_ID) {
    console.error("ACCESS_TOKEN and PROJECT_ID are required.");
    process.exit(1);
  }

  const counts = await deleteUnverified({
    api: createApi({ accessToken: ACCESS_TOKEN, projectId: PROJECT_ID }),
    now: NOW ? new Date(NOW) : new Date(),
    dryRun: DRY_RUN === "1",
  });
  console.log(JSON.stringify(counts));
  if (counts.failed > 0) process.exit(1);
}
