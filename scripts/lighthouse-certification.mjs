#!/usr/bin/env node
/** Run Lighthouse certification suite against local production server. */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const OUT_DIR = join(ROOT, "tmp", "lighthouse-10-1e");
const BASE = process.env.LH_BASE_URL ?? "http://localhost:3010";

const PAGES = [
  { id: "home", path: "/" },
  { id: "products", path: "/products" },
  { id: "pdp", path: "/products/daily-care-gift-hamper" },
  { id: "checkout", path: "/checkout" },
  { id: "account", path: "/account" },
  { id: "trust-center", path: "/trust-center" },
  { id: "admin-login", path: "/admin/login" },
];

const METRIC_KEYS = [
  "first-contentful-paint",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "speed-index",
  "interactive",
  "max-potential-fid",
  "server-response-time",
];

const CHROME_FLAGS =
  "--headless=new --no-sandbox --disable-gpu --disable-features=HttpsUpgrades,HttpsFirstModeV2,HttpsFirstModeV2ForEngagedSites";

function runLighthouse(url, formFactor, outPath) {
  const args = [
    url,
    `--chrome-flags=${CHROME_FLAGS}`,
    `--form-factor=${formFactor}`,
    "--screenEmulation.mobile=" + (formFactor === "mobile" ? "true" : "false"),
    "--output=json",
    `--output-path=${outPath}`,
    "--quiet",
  ];
  if (formFactor === "desktop") {
    args.push("--preset=desktop");
  }
  const r = spawnSync("npx", ["lighthouse", ...args], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return r.status === 0;
}

function parseReport(filePath) {
  const data = JSON.parse(readFileSync(filePath, "utf8"));
  const cats = data.categories ?? {};
  const scores = {
    performance: Math.round((cats.performance?.score ?? 0) * 100),
    accessibility: Math.round((cats.accessibility?.score ?? 0) * 100),
    "best-practices": Math.round((cats["best-practices"]?.score ?? 0) * 100),
    seo: Math.round((cats.seo?.score ?? 0) * 100),
  };
  const metrics = {};
  for (const k of METRIC_KEYS) {
    const a = data.audits?.[k];
    if (a) metrics[k] = { display: a.displayValue, numeric: a.numericValue };
  }
  const lcpEl = data.audits?.["largest-contentful-paint-element"]?.details?.items?.[0]?.node?.snippet;
  const unusedJs = data.audits?.["unused-javascript"]?.details?.overallSavingsBytes ?? 0;
  const unusedCss = data.audits?.["unused-css-rules"]?.details?.overallSavingsBytes ?? 0;
  const bootup = data.audits?.["bootup-time"]?.numericValue ?? 0;
  const thirdParty = data.audits?.["third-party-summary"]?.displayValue ?? "n/a";
  return { scores, metrics, lcpElement: lcpEl?.replace(/\s+/g, " ").trim(), unusedJs, unusedCss, bootup, thirdParty };
}

async function main() {
  const phase = process.argv[2] ?? "baseline";
  mkdirSync(join(OUT_DIR, phase), { recursive: true });

  const results = [];
  for (const page of PAGES) {
    for (const form of ["desktop", "mobile"]) {
      const outPath = join(OUT_DIR, phase, `${page.id}-${form}.json`);
      const url = `${BASE}${page.path}`;
      process.stdout.write(`LH ${phase} ${form} ${page.path} … `);
      const ok = runLighthouse(url, form, outPath);
      if (!ok) {
        console.log("FAILED");
        results.push({ page: page.id, form, error: true });
        continue;
      }
      const parsed = parseReport(outPath);
      console.log(`perf=${parsed.scores.performance} a11y=${parsed.scores.accessibility}`);
      results.push({ page: page.id, path: page.path, form, ...parsed });
    }
  }
  writeFileSync(join(OUT_DIR, `${phase}-summary.json`), JSON.stringify(results, null, 2));
  console.log(`Wrote ${join(OUT_DIR, `${phase}-summary.json`)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
