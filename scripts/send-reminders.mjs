// Sends the daily reminders. Run every hour by .github/workflows/reminders.yml.
//
// For each reminders/{uid} document it sends one notification per device when the
// user's chosen hour has started in their time zone, some habit is still left to do
// there today, and no reminder went out today. The app works out "left to do" and
// saves the day everything was done as lastMarkedDate, so this script never reads
// habits. It talks to the Firestore and FCM REST APIs with a
// short-lived access token, so it needs no dependencies and no stored key.
//
// Env: ACCESS_TOKEN, PROJECT_ID, APP_URL. Optional: DRY_RUN=1 (send and write
// nothing), NOW (an ISO time, for testing).
//
// The repository is public, and so are its workflow logs: log counts only, never
// user ids, tokens or settings.

import { pathToFileURL } from "node:url";

// A run delayed by GitHub still catches up, but not so late that it surprises anyone.
const CATCH_UP_HOURS = 2;

const TITLE = "Don't break the chain";
const DAY_MS = 24 * 60 * 60 * 1000;

const previousDay = (date) => new Date(Date.parse(`${date}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10);

/**
 * The notification text, from the counts the app saves (progress). Never habit names
 * or notes: they can be health data, and they would pass through the browsers' push
 * services. Counts from yesterday still tell how many habits wait and which chain is
 * open today; older ones say nothing reliable, so the text stays general.
 */
export const reminderBody = (progress, localDate) => {
  let left, total, chain;
  if (progress?.date === localDate) {
    ({ left, total } = progress);
    chain = progress.openChain;
  } else if (progress?.date === previousDay(localDate)) {
    left = total = progress.total;
    chain = progress.doneChain;
  }

  const day =
    left === undefined || !total ? "Some habits aren't marked yet."
    : total === 1 ? "Today isn't marked yet."
    : left === 1 ? "One habit left today."
    : left < total ? `${left} of ${total} habits left today.`
    : `All ${total} habits are waiting.`;
  const nudge =
    chain >= 3 ? `Keep your ${chain}-day chain going 🔗`
    : left === 1 ? "Finish the day ✅"
    : "Keep your chain going.";
  return `${day} ${nudge}`;
};

/** The user's local date (YYYY-MM-DD) and hour at `now`. Throws on an invalid zone. */
export const localTime = (now, timeZone) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
};

/** Whether a reminder is due now, and for which local date. */
export const reminderDue = (settings, now) => {
  const { hour, timeZone, tokens, lastMarkedDate, lastRemindedDate } = settings;
  if (!Number.isInteger(hour) || typeof timeZone !== "string") return { due: false };
  if (!Array.isArray(tokens) || !tokens.some((t) => typeof t === "string")) return { due: false };

  const local = localTime(now, timeZone);
  const hoursLate = local.hour - hour;
  const due =
    hoursLate >= 0 &&
    hoursLate <= CATCH_UP_HOURS &&
    lastMarkedDate !== local.date &&
    lastRemindedDate !== local.date;
  return { due, date: local.date };
};

/**
 * Whether an FCM error means the token can never work again. Decided only from FCM's
 * own error details, so a misconfiguration (say, a wrong project) never deletes tokens.
 */
export const isDeadToken = (error) => {
  const details = error?.details ?? [];
  const fcmCode = details.find((d) => d["@type"]?.endsWith("fcm.v1.FcmError"))?.errorCode;
  if (fcmCode === "UNREGISTERED" || fcmCode === "SENDER_ID_MISMATCH") return true;
  // A malformed token: FCM points at the token field itself.
  return (
    fcmCode === "INVALID_ARGUMENT" &&
    details.some((d) => d.fieldViolations?.some((v) => v.field === "message.token"))
  );
};

// Firestore REST values → plain values, for the fields this script reads.
const fromFirestore = (fields = {}) => ({
  hour: fields.hour?.integerValue !== undefined ? Number(fields.hour.integerValue) : undefined,
  timeZone: fields.timeZone?.stringValue,
  tokens: (fields.tokens?.arrayValue?.values ?? []).map((v) => v.stringValue),
  lastMarkedDate: fields.lastMarkedDate?.stringValue,
  lastRemindedDate: fields.lastRemindedDate?.stringValue,
  progress: fromProgress(fields.progress?.mapValue?.fields),
});

function fromProgress(p) {
  return (
    p && {
      date: p.date?.stringValue,
      left: Number(p.left?.integerValue),
      total: Number(p.total?.integerValue),
      openChain: Number(p.openChain?.integerValue ?? 0),
      doneChain: Number(p.doneChain?.integerValue ?? 0),
    }
  );
}

const createApi = ({ accessToken, projectId }) => {
  const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
  const documents = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  const call = async (url, init = {}) => {
    const response = await fetch(url, { ...init, headers });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), { body });
    return body;
  };

  return {
    async *reminders() {
      let pageToken = "";
      do {
        const page = await call(
          `${documents}/reminders?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`,
        );
        yield* page.documents ?? [];
        pageToken = page.nextPageToken ?? "";
      } while (pageToken);
    },

    async send(token, link, body) {
      try {
        await call(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
          method: "POST",
          body: JSON.stringify({
            message: {
              token,
              notification: { title: TITLE, body },
              webpush: { fcm_options: { link } },
            },
          }),
        });
        return "sent";
      } catch (error) {
        if (isDeadToken(error.body?.error)) return "dead";
        throw error;
      }
    },

    // Only these fields change, and only if the document still exists: the user may
    // have turned reminders off while this run was going.
    async update(name, { remindedDate, deadTokens }) {
      const writes = [
        {
          update: {
            name,
            fields: remindedDate ? { lastRemindedDate: { stringValue: remindedDate } } : {},
          },
          updateMask: { fieldPaths: remindedDate ? ["lastRemindedDate"] : [] },
          currentDocument: { exists: true },
          ...(deadTokens.length > 0 && {
            updateTransforms: [
              {
                fieldPath: "tokens",
                removeAllFromArray: { values: deadTokens.map((t) => ({ stringValue: t })) },
              },
            ],
          }),
        },
      ];
      await call(`${documents}:commit`, { method: "POST", body: JSON.stringify({ writes }) });
    },
  };
};

// HTTP errors carry only a status here; anything else is logged by name, since an
// Intl error message would include the user's time zone.
const logFailure = (error) =>
  console.warn("A reminder failed:", error?.body ? error.message : (error?.name ?? "Error"));

export const sendReminders = async ({ api, now, link, dryRun }) => {
  const counts = { checked: 0, due: 0, sent: 0, deadTokens: 0, failed: 0 };

  for await (const doc of api.reminders()) {
    counts.checked += 1;
    // One bad document (an invalid time zone, a junk token) must not stop the run.
    try {
      const settings = fromFirestore(doc.fields);
      const { due, date } = reminderDue(settings, now);
      if (!due) continue;
      counts.due += 1;
      if (dryRun) continue;

      const body = reminderBody(settings.progress, date);
      const deadTokens = [];
      let sent = 0;
      // Each device on its own: a temporary error for one must not hold up the others.
      for (const token of settings.tokens.filter((t) => typeof t === "string")) {
        try {
          if ((await api.send(token, link, body)) === "sent") sent += 1;
          else deadTokens.push(token);
        } catch (error) {
          counts.failed += 1;
          logFailure(error);
        }
      }
      counts.sent += sent;
      counts.deadTokens += deadTokens.length;
      // When every send failed for a temporary reason, the day stays open so the next
      // run can retry within the catch-up window.
      if (sent > 0 || deadTokens.length > 0) {
        await api.update(doc.name, { remindedDate: sent > 0 ? date : undefined, deadTokens });
      }
    } catch (error) {
      counts.failed += 1;
      logFailure(error);
    }
  }
  return counts;
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { ACCESS_TOKEN, PROJECT_ID, APP_URL, DRY_RUN, NOW } = process.env;
  if (!ACCESS_TOKEN || !PROJECT_ID || !APP_URL) {
    console.error("ACCESS_TOKEN, PROJECT_ID and APP_URL are required.");
    process.exit(1);
  }

  const counts = await sendReminders({
    api: createApi({ accessToken: ACCESS_TOKEN, projectId: PROJECT_ID }),
    now: NOW ? new Date(NOW) : new Date(),
    link: APP_URL,
    dryRun: DRY_RUN === "1",
  });
  console.log(JSON.stringify(counts));
  // Fail the run, so GitHub reports it, when something went wrong for a user.
  if (counts.failed > 0) process.exit(1);
}
