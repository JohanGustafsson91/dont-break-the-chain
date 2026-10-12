// One-off, idempotent: the identity of .github/workflows/cleanup.yml in the prod project.
// Run by the project owner from the repository root, signed in with `npx firebase login`:
//   node scripts/setup/account-cleaner-identity.cjs
//
// A custom role with only what the job needs (list and delete Auth users), a keyless
// service account with that role, and a provider in the existing Workload Identity pool
// that only accepts cleanup.yml on main of this repository.
const a = require(process.cwd() + "/node_modules/firebase-tools/lib/auth");
const P = "dont-break-the-chain-cb8a0", NUM = "851735171429";
const REPO = "JohanGustafsson91/dont-break-the-chain", REPO_ID = "931181099", OWNER_ID = "15063798";
const WORKFLOW_REF = `${REPO}/.github/workflows/cleanup.yml@refs/heads/main`;
const SA = `account-cleaner@${P}.iam.gserviceaccount.com`;
const ROLE = `projects/${P}/roles/accountCleaner`;
const POOL = `projects/${NUM}/locations/global/workloadIdentityPools/github`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const t = (await a.getAccessToken(a.getGlobalDefaultAccount().tokens.refresh_token, [])).access_token;
  const h = { Authorization: "Bearer " + t, "Content-Type": "application/json", "x-goog-user-project": P };
  const call = async (method, url, body) => {
    const r = await fetch(url, { method, headers: h, body: body && JSON.stringify(body) });
    return { status: r.status, j: await r.json().catch(() => ({})) };
  };
  // 409 "already exists" is fine: the script can be run again.
  const step = (name, { status, j }) =>
    console.log(name, status, status >= 300 ? (j.error?.message ?? "").slice(0, 160) : "");
  const waitOp = async (url) => {
    for (let i = 0; i < 30; i++) {
      const { j } = await call("GET", url);
      if (j.done) return j;
      await sleep(2000);
    }
  };

  // An existing role is left as it is (409): the check at the end prints its permissions.
  step("1 custom role", await call("POST", `https://iam.googleapis.com/v1/projects/${P}/roles`, {
    roleId: "accountCleaner",
    role: {
      title: "Account cleaner",
      description: "Lists and deletes Firebase Auth users, for deleting unverified email accounts",
      includedPermissions: ["firebaseauth.users.get", "firebaseauth.users.delete"],
      stage: "GA",
    },
  }));

  step("2 service account", await call("POST", `https://iam.googleapis.com/v1/projects/${P}/serviceAccounts`, {
    accountId: "account-cleaner",
    serviceAccount: {
      displayName: "Account cleaner (GitHub Actions)",
      description: "Deletes unverified email accounts from .github/workflows/cleanup.yml",
    },
  }));
  await sleep(5000);

  const pol = (await call("POST", `https://cloudresourcemanager.googleapis.com/v1/projects/${P}:getIamPolicy`, {
    options: { requestedPolicyVersion: 3 },
  })).j;
  const member = `serviceAccount:${SA}`;
  let b = pol.bindings.find((x) => x.role === ROLE && !x.condition);
  if (!b) pol.bindings.push((b = { role: ROLE, members: [] }));
  if (!b.members.includes(member)) b.members.push(member);
  step("3 grant role", await call("POST", `https://cloudresourcemanager.googleapis.com/v1/projects/${P}:setIamPolicy`, { policy: pol }));

  const prov = await call("POST", `https://iam.googleapis.com/v1/${POOL}/providers?workloadIdentityPoolProviderId=cleanup`, {
    displayName: "Cleanup workflow",
    attributeMapping: {
      "google.subject": "assertion.sub",
      "attribute.repository_id": "assertion.repository_id",
      "attribute.workflow_ref": "assertion.workflow_ref",
    },
    attributeCondition: [
      `assertion.repository_id == '${REPO_ID}'`,
      `assertion.repository_owner_id == '${OWNER_ID}'`,
      `assertion.workflow_ref == '${WORKFLOW_REF}'`,
    ].join(" && "),
    oidc: { issuerUri: "https://token.actions.githubusercontent.com" },
  });
  step("4 provider", prov);
  if (prov.j.name?.includes("/operations/")) await waitOp(`https://iam.googleapis.com/v1/${prov.j.name}`);

  const saUrl = `https://iam.googleapis.com/v1/projects/${P}/serviceAccounts/${SA}`;
  const saPol = (await call("POST", `${saUrl}:getIamPolicy`, {})).j;
  // Replaces every binding on purpose: this account exists only for this workflow.
  saPol.bindings = [{
    role: "roles/iam.workloadIdentityUser",
    members: [`principalSet://iam.googleapis.com/${POOL}/attribute.workflow_ref/${WORKFLOW_REF}`],
  }];
  step("5 workloadIdentityUser", await call("POST", `${saUrl}:setIamPolicy`, { policy: saPol }));

  const pv = (await call("GET", `https://iam.googleapis.com/v1/${POOL}/providers/cleanup`)).j;
  console.log("provider:", pv.state, "\ncondition:", pv.attributeCondition);
  const roles = (await call("POST", `https://cloudresourcemanager.googleapis.com/v1/projects/${P}:getIamPolicy`, {})).j
    .bindings.filter((x) => x.members.includes(member)).map((x) => x.role);
  console.log("project roles:", roles);
  console.log("role permissions:", (await call("GET", `https://iam.googleapis.com/v1/${ROLE}`)).j.includedPermissions);
  console.log("user-managed keys:", ((await call("GET", `${saUrl}/keys?keyTypes=USER_MANAGED`)).j.keys ?? []).length);
})();
