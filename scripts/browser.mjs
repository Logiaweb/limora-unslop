// Shared by the skill's scripts: find Playwright and open a browser.
// PLAYWRIGHT_DIR=<folder with node_modules> reuses a Playwright installed in another project.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function stop(message) { console.error(message); process.exit(1); }

export function findPlaywright() {
  const lookIn = [process.env.PLAYWRIGHT_DIR, process.cwd(), SKILL_ROOT].filter(Boolean);
  const npmGlobal = spawnSync("npm", ["root", "-g"], { encoding: "utf8" });
  if (npmGlobal.status === 0) lookIn.push(npmGlobal.stdout.trim());
  const req = createRequire(import.meta.url);
  for (const pkg of ["playwright-core", "playwright"]) {
    try { return req(req.resolve(pkg, { paths: lookIn })); } catch { /* keep looking */ }
  }
  stop("This step needs Playwright. Install it in the project with:\n  npm i -D playwright && npx playwright install chromium\n" +
    "Or point to an existing install: PLAYWRIGHT_DIR=/path/to/a/project/with/playwright node ...");
}

export async function openBrowser(visible = false) {
  const { chromium } = findPlaywright();
  const flags = ["--autoplay-policy=no-user-gesture-required", "--allow-file-access-from-files"];
  for (const extra of [{}, { channel: "chrome" }, { channel: "msedge" }]) {
    try { return await chromium.launch({ headless: !visible, args: flags, ...extra }); } catch { /* try the next browser */ }
  }
  stop("Playwright found no browser to drive. Run: npx playwright install chromium");
}

// Simple --flag value parser shared by the scripts.
export function parseArgs(list, takesValue) {
  const options = {}, positional = [];
  for (let i = 0; i < list.length; i++) {
    if (!list[i].startsWith("--")) { positional.push(list[i]); continue; }
    const key = list[i].slice(2);
    options[key] = takesValue.has(key) ? list[++i] : true;
  }
  return { options, positional };
}
