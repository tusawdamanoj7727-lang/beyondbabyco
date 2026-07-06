#!/usr/bin/env node
/**
 * Phase 10.5 — Real customer journey audit.
 * Run: node scripts/customer-journey-audit.mjs
 * Requires dev server at PLAYWRIGHT_BASE_URL (default NEXT_PUBLIC_SITE_URL or production URL)
 */
import { chromium, devices } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://beyondbabyco.in";
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "../tmp/customer-journeys-10-5");
const CMS_SLUGS = [
  "about", "our-story", "research", "contact", "faq", "privacy-policy", "terms",
  "trust-center-path", // placeholder replaced at runtime
];
const PRODUCT_SLUG = process.env.JOURNEY_PRODUCT_SLUG ?? "daily-care-gift-hamper";

/** @type {Array<{ id: number; name: string; persona: string; steps: Array<{ action: string; path?: string; note?: string }> }>} */
const JOURNEYS = [
  { id: 1, name: "Google organic → COD checkout intent", persona: "New parent", steps: [
    { action: "land", path: "/" }, { action: "navigate", path: "/products" },
    { action: "navigate", path: `/products/${PRODUCT_SLUG}` }, { action: "navigate", path: "/cart" },
    { action: "navigate", path: "/checkout", note: "Expect login redirect — auth required" },
  ]},
  { id: 2, name: "Instagram → search → wishlist", persona: "Social visitor", steps: [
    { action: "land", path: "/" }, { action: "navigate", path: "/search?q=hamper" },
    { action: "navigate", path: "/wishlist" },
  ]},
  { id: 3, name: "Homepage → category browse → PDP", persona: "Browser", steps: [
    { action: "land", path: "/" }, { action: "navigate", path: "/products" },
    { action: "navigate", path: `/products/${PRODUCT_SLUG}` },
  ]},
  { id: 4, name: "Returning customer account", persona: "Logged-out return", steps: [
    { action: "navigate", path: "/account", note: "Redirect to login" },
    { action: "navigate", path: "/login?redirectTo=/account" },
  ]},
  { id: 5, name: "Guest cart then checkout gate", persona: "Guest", steps: [
    { action: "land", path: "/cart" }, { action: "navigate", path: "/checkout", note: "No guest checkout — login required" },
  ]},
  { id: 6, name: "Payment failure page", persona: "Post-payment", steps: [
    { action: "navigate", path: "/checkout/failure" },
  ]},
  { id: 7, name: "Order success page direct", persona: "Post-order", steps: [
    { action: "navigate", path: "/checkout/success" },
  ]},
  { id: 8, name: "Forgot password", persona: "Account recovery", steps: [
    { action: "navigate", path: "/forgot-password" },
  ]},
  { id: 9, name: "Order tracking via account", persona: "Customer", steps: [
    { action: "navigate", path: "/account/orders", note: "Auth redirect expected" },
  ]},
  { id: 10, name: "Contact support", persona: "Help seeker", steps: [
    { action: "navigate", path: "/contact" }, { action: "navigate", path: "/account/support", note: "Support may redirect" },
  ]},
  { id: 11, name: "Trust center research", persona: "Safety-conscious parent", steps: [
    { action: "land", path: "/trust-center" },
  ]},
  { id: 12, name: "Community → review gallery", persona: "Social proof", steps: [
    { action: "navigate", path: "/community" }, { action: "navigate", path: "/reviews/gallery" },
  ]},
  { id: 13, name: "About → our story", persona: "Brand researcher", steps: [
    { action: "navigate", path: "/about" }, { action: "navigate", path: "/our-story" },
  ]},
  { id: 14, name: "FAQ self-service", persona: "Pre-purchase", steps: [
    { action: "navigate", path: "/faq" },
  ]},
  { id: 15, name: "Legal privacy read", persona: "Compliance", steps: [
    { action: "navigate", path: "/privacy-policy" }, { action: "navigate", path: "/terms" },
  ]},
  { id: 16, name: "Shipping & returns policies", persona: "Buyer", steps: [
    { action: "navigate", path: "/shipping-policy" }, { action: "navigate", path: "/return-policy" },
  ]},
  { id: 17, name: "Register new account", persona: "New user", steps: [
    { action: "navigate", path: "/register" },
  ]},
  { id: 18, name: "Login with redirect to checkout", persona: "Buyer", steps: [
    { action: "navigate", path: "/login?redirectTo=/checkout" },
  ]},
  { id: 19, name: "Product search empty query", persona: "Explorer", steps: [
    { action: "navigate", path: "/search" },
  ]},
  { id: 20, name: "Product search brand filter", persona: "Explorer", steps: [
    { action: "navigate", path: "/products?sort=newest" },
  ]},
  { id: 21, name: "Ingredients transparency", persona: "Ingredient-aware", steps: [
    { action: "navigate", path: "/ingredients" },
  ]},
  { id: 22, name: "Manufacturing story", persona: "Trust", steps: [
    { action: "navigate", path: "/manufacturing" },
  ]},
  { id: 23, name: "Certifications page", persona: "Trust", steps: [
    { action: "navigate", path: "/certifications" },
  ]},
  { id: 24, name: "Safety standards", persona: "Parent", steps: [
    { action: "navigate", path: "/safety-standards" },
  ]},
  { id: 25, name: "Why BeyondBabyCo", persona: "Comparison shopper", steps: [
    { action: "navigate", path: "/why-beyondbabyco" },
  ]},
  { id: 26, name: "Research deep dive", persona: "Research-driven", steps: [
    { action: "navigate", path: "/research" },
  ]},
  { id: 27, name: "Careers page", persona: "Job seeker", steps: [
    { action: "navigate", path: "/careers" },
  ]},
  { id: 28, name: "Press page", persona: "Media", steps: [
    { action: "navigate", path: "/press" },
  ]},
  { id: 29, name: "Cookies policy", persona: "Privacy", steps: [
    { action: "navigate", path: "/cookies" },
  ]},
  { id: 30, name: "Refund policy", persona: "Buyer", steps: [
    { action: "navigate", path: "/refund-policy" },
  ]},
  { id: 31, name: "Account profile gate", persona: "Customer", steps: [
    { action: "navigate", path: "/account/profile", note: "Auth redirect" },
  ]},
  { id: 32, name: "Account addresses gate", persona: "Customer", steps: [
    { action: "navigate", path: "/account/addresses", note: "Auth redirect" },
  ]},
  { id: 33, name: "Account downloads gate", persona: "Customer", steps: [
    { action: "navigate", path: "/account/downloads", note: "Auth redirect" },
  ]},
  { id: 34, name: "Homepage anchor products section", persona: "Scroller", steps: [
    { action: "land", path: "/#products", note: "Home sections" },
  ]},
  { id: 35, name: "Robots.txt SEO", persona: "Crawler", steps: [
    { action: "navigate", path: "/robots.txt" },
  ]},
  { id: 36, name: "Sitemap.xml SEO", persona: "Crawler", steps: [
    { action: "navigate", path: "/sitemap.xml" },
  ]},
  { id: 37, name: "404 unknown product", persona: "Broken link", steps: [
    { action: "navigate", path: "/products/this-product-does-not-exist-xyz", note: "Expect 404" },
  ]},
  { id: 38, name: "404 unknown CMS page", persona: "Broken link", steps: [
    { action: "navigate", path: "/not-a-real-page-xyz", note: "Expect 404" },
  ]},
  { id: 39, name: "Logout route", persona: "Session end", steps: [
    { action: "navigate", path: "/logout" },
  ]},
  { id: 40, name: "Mobile homepage", persona: "Mobile user", steps: [
    { action: "land", path: "/", mobile: true },
  ]},
  { id: 41, name: "Mobile products grid", persona: "Mobile shopper", steps: [
    { action: "navigate", path: "/products", mobile: true },
  ]},
  { id: 42, name: "Mobile PDP", persona: "Mobile shopper", steps: [
    { action: "navigate", path: `/products/${PRODUCT_SLUG}`, mobile: true },
  ]},
  { id: 43, name: "Mobile cart empty", persona: "Mobile guest", steps: [
    { action: "navigate", path: "/cart", mobile: true },
  ]},
  { id: 44, name: "Mobile trust center", persona: "Mobile parent", steps: [
    { action: "navigate", path: "/trust-center", mobile: true },
  ]},
  { id: 45, name: "Mobile search", persona: "Mobile", steps: [
    { action: "navigate", path: "/search?q=baby", mobile: true },
  ]},
  { id: 46, name: "Health API (customer uptime)", persona: "Monitor", steps: [
    { action: "api", path: "/api/health" },
  ]},
  { id: 47, name: "Homepage → PDP reviews scroll", persona: "Reviewer", steps: [
    { action: "navigate", path: `/products/${PRODUCT_SLUG}` }, { action: "navigate", path: "/reviews/gallery" },
  ]},
  { id: 48, name: "Wishlist empty state", persona: "Guest", steps: [
    { action: "navigate", path: "/wishlist" },
  ]},
  { id: 49, name: "Campaign landing (if exists)", persona: "Email click", steps: [
    { action: "navigate", path: "/campaigns/summer-sale", note: "May 404 if no campaign" },
  ]},
  { id: 50, name: "Full footer legal loop", persona: "Diligent buyer", steps: [
    { action: "land", path: "/" }, { action: "navigate", path: "/contact" },
    { action: "navigate", path: "/faq" }, { action: "navigate", path: "/products" },
  ]},
];

async function runJourney(browser, journey) {
  const isMobile = journey.steps.some((s) => s.mobile);
  const context = await browser.newContext(isMobile ? devices["iPhone 13"] : {});
  const page = await context.newPage();
  const issues = [];
  const consoleErrors = [];
  const networkFailures = [];
  let clicks = 0;
  let finalUrl = BASE;
  let maxLoadMs = 0;

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 200));
  });
  page.on("requestfailed", (req) => {
    const url = req.url();
    if (!url.includes("favicon") && !url.includes("_next/webpack-hmr")) {
      networkFailures.push({ url: url.slice(0, 120), failure: req.failure()?.errorText ?? "failed" });
    }
  });

  for (const step of journey.steps) {
    if (step.action === "api") {
      const res = await context.request.get(`${BASE}${step.path}`);
      if (!res.ok()) issues.push({ type: "http", severity: "P1", detail: `${step.path} returned ${res.status()}` });
      clicks++;
      continue;
    }
    const url = `${BASE}${step.path}`;
    const start = Date.now();
    let response;
    try {
      response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    } catch (e) {
      issues.push({ type: "navigation", severity: "P0", detail: `Failed to load ${step.path}: ${e.message}` });
      continue;
    }
    const loadMs = Date.now() - start;
    maxLoadMs = Math.max(maxLoadMs, loadMs);
    clicks++;
    finalUrl = page.url();

    const status = response?.status() ?? 0;
    if (step.note?.includes("404") && status === 404) continue;
    if (step.note?.includes("404") && status !== 404) {
      issues.push({ type: "expected-404", severity: "P2", detail: `Expected 404 for ${step.path}, got ${status}` });
    } else if (!step.note?.includes("404") && status >= 400 && status !== 401) {
      issues.push({ type: "http", severity: status >= 500 ? "P0" : "P1", detail: `${step.path} HTTP ${status}` });
    }

    if (step.note?.includes("redirect") || step.note?.includes("login")) {
      if (finalUrl.includes("/login") && step.path.includes("/account")) continue;
      if (finalUrl.includes("/login") && step.path === "/checkout") continue;
      if (finalUrl.includes("/login") && step.path.includes("/account/")) continue;
    }

    const bodyText = await page.locator("body").innerText().catch(() => "");
    if (bodyText.length < 50 && !step.note?.includes("404")) {
      issues.push({ type: "empty", severity: "P1", detail: `Thin/empty body on ${step.path}` });
    }
    if (bodyText.includes("Application error") || bodyText.includes("Internal Server Error")) {
      issues.push({ type: "error-page", severity: "P0", detail: `Error shell on ${step.path}` });
    }

    if (loadMs > 8000) {
      issues.push({ type: "slow", severity: "P2", detail: `${step.path} loaded in ${loadMs}ms` });
    }
  }

  if (consoleErrors.length) {
    const unique = [...new Set(consoleErrors)].slice(0, 5);
    issues.push({ type: "console", severity: "P1", detail: unique.join(" | ") });
  }
  if (networkFailures.length) {
    issues.push({ type: "network", severity: "P2", detail: `${networkFailures.length} failed request(s)` });
  }

  await context.close();
  return { journeyId: journey.id, name: journey.name, persona: journey.persona, clicks, finalUrl, maxLoadMs, issues, networkFailures: networkFailures.slice(0, 3), consoleErrors: consoleErrors.slice(0, 3) };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const j of JOURNEYS) {
    process.stderr.write(`Journey ${j.id}/50…\n`);
    results.push(await runJourney(browser, j));
  }
  await browser.close();
  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    totalJourneys: results.length,
    passed: results.filter((r) => r.issues.length === 0).length,
    withIssues: results.filter((r) => r.issues.length > 0).length,
    results,
  };
  writeFileSync(join(OUT_DIR, "journey-results.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ passed: summary.passed, withIssues: summary.withIssues, out: join(OUT_DIR, "journey-results.json") }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
