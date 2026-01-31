import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const srcDir = join(root, "src");
const entries = existsSync(srcDir)
  ? readdirSync(srcDir, { recursive: true, encoding: "utf8" })
  : [];

const suffix = ["evals", "promptfooconfig.yaml"].join(sep);
const configs = entries
  .filter((entry) => entry.endsWith(suffix))
  .map((entry) => join("src", entry));

if (configs.length === 0) {
  console.log("No colocated eval configs found under src/");
  process.exit(0);
}

const filter = process.argv[2];
let passed = 0;
let failed = 0;

for (const config of configs) {
  if (filter && !config.includes(filter)) continue;

  console.log(`\n--- ${dirname(config)} ---\n`);

  try {
    execFileSync("bunx", ["promptfoo", "eval", "--config", config], {
      cwd: root,
      stdio: "inherit",
    });
    passed++;
  } catch {
    failed++;
  }
}

if (filter && passed + failed === 0) {
  console.error(`No configs matched filter: ${filter}`);
  process.exit(1);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
