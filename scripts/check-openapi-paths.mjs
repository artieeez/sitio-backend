/**
 * Smoke-check OpenAPI contract file + Nest route strings.
 * Run: node scripts/check-openapi-paths.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const openapiPath = path.join(
  root,
  "../sitio-design-notes/specs/001-school-trip-payments/contracts/openapi.yaml",
);

if (!fs.existsSync(openapiPath)) {
  console.error("OpenAPI file not found:", openapiPath);
  process.exit(1);
}

const openapi = fs.readFileSync(openapiPath, "utf8");

function walk(dir, acc) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      walk(p, acc);
    } else if (name.endsWith(".controller.ts")) {
      acc.push(fs.readFileSync(p, "utf8"));
    }
  }
}
const chunks = [];
walk(path.join(root, "src"), chunks);
const controllerText = chunks.join("\n");

const inOpenApi = [
  "passenger-status-aggregates",
  "manual-paid-without-info",
  "/passengers/{passengerId}/payments",
];
const inControllers = [
  "passenger-status-aggregates",
  "manual-paid-without-info",
  "passengers",
  "payments",
];

for (const s of inOpenApi) {
  if (!openapi.includes(s)) {
    console.error("OpenAPI missing:", s);
    process.exit(1);
  }
}
for (const s of inControllers) {
  if (!controllerText.includes(s)) {
    console.error("Controllers missing substring:", s);
    process.exit(1);
  }
}
console.log("OpenAPI contract smoke check passed.");
