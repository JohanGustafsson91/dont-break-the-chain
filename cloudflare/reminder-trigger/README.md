# Reminder trigger (Cloudflare Worker)

Starts `.github/workflows/reminders.yml` two minutes past every hour, because GitHub's
own schedule skips or delays runs. GitHub's schedule stays on as a backup; the
workflow sends at most one reminder per user and day, so double runs are harmless.

## Set up (once)

1. On GitHub: Settings → Developer settings → Personal access tokens → Fine-grained
   tokens → Generate new token.
   - Repository access: **Only select repositories** → this repository.
   - Permissions → Repository permissions → **Actions: Read and write**. Nothing else.
   - Expiration: as long as allowed. Put a reminder in your calendar to renew it.
2. Deploy: `npx wrangler@4 login`, then from this folder `npx wrangler@4 deploy`.
3. In the Cloudflare dashboard: Workers & Pages → `dbtc-reminder-trigger` → Settings →
   Variables and Secrets → Add → type **Secret**, name `GITHUB_TOKEN`, value the token.
4. Check: Workers & Pages → `dbtc-reminder-trigger` → Settings → Triggers shows the
   cron. After the next full hour, the repository's Actions tab shows a
   "Send daily reminders" run started by `workflow_dispatch`.

If runs stop, look at the Worker's logs: Workers & Pages → `dbtc-reminder-trigger` →
Observability (an expired token answers 401). GitHub emails a warning before a
fine-grained token expires; renew it then and replace the secret. GitHub's own schedule
keeps sending reminders meanwhile, just less reliably.
