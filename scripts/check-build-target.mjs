// Firebase runs this before deploying hosting. It refuses to deploy a build that was
// made for another Firebase project, such as a dev build to production.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const project = process.env.GCLOUD_PROJECT;
const assets = join(process.env.PROJECT_DIR ?? ".", "dist", "assets");

const builtFor = (file) => readFileSync(join(assets, file), "utf8").includes(`"${project}"`);
const ok =
  Boolean(project) &&
  existsSync(assets) &&
  readdirSync(assets).some((f) => f.endsWith(".js") && builtFor(f));

if (!ok) {
  console.error(
    `dist/ was not built for the Firebase project "${project}". ` +
      "Use `pnpm run deploy` for dev, and the production build for production.",
  );
  process.exit(1);
}
