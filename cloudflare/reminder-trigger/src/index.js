// Starts the "Send daily reminders" workflow on GitHub every hour. GitHub's own
// schedule often skips or delays runs under load; Cloudflare's cron triggers run on
// time. The workflow sends at most one reminder per user and day, so a second run
// from GitHub's schedule does nothing.
//
// Needs one secret, GITHUB_TOKEN: a fine-grained token for this repository only, with
// "Actions: Read and write" and nothing else. With it one can start, cancel or delete
// workflow runs here, but not read or change code, secrets or variables.
const DISPATCH_URL =
  "https://api.github.com/repos/JohanGustafsson91/dont-break-the-chain/actions/workflows/reminders.yml/dispatches";

export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(startWorkflow(env));
  },
};

async function startWorkflow(env) {
  const response = await fetch(DISPATCH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "dbtc-reminder-trigger",
    },
    body: JSON.stringify({ ref: "main" }),
  });
  // A failure shows up in the Worker's logs in the Cloudflare dashboard.
  if (!response.ok) throw new Error(`GitHub answered ${response.status}: ${await response.text()}`);
}
