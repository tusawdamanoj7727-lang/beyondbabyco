/**
 * One-off production verification for account fixes (wishlist, order detail, security).
 * Usage: node --env-file=tests/e2e/production.env scripts/verify-account-fixes.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "https://beyondbabyco.in";
const email = process.env.E2E_CUSTOMER_EMAIL;
const password = process.env.E2E_CUSTOMER_PASSWORD;

if (!email || !password) {
  console.error("Missing E2E_CUSTOMER_EMAIL / E2E_CUSTOMER_PASSWORD");
  process.exit(1);
}

const results = [];

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`PASS ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.log(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("Email address").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign In →" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 45_000 });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

try {
  await login(page);

  // Security page
  await page.goto(`${BASE}/account/security`, { waitUntil: "domcontentloaded" });
  const secTitle = await page.getByRole("heading", { name: "Security", exact: true }).count();
  const changePw = await page.getByRole("heading", { name: "Change password" }).count();
  if (secTitle && changePw && !page.url().includes("login")) {
    pass("account/security", "Change password + Security headings visible");
  } else {
    fail("account/security", `url=${page.url()} title=${secTitle} change=${changePw}`);
  }

  // Order detail
  await page.goto(`${BASE}/account/orders`, { waitUntil: "domcontentloaded" });
  const orderLink = page.locator('a[href*="/account/orders/"]').filter({ hasText: /ORD-/ }).first();
  // Prefer confirmed order if present
  const confirmed = page.getByRole("link", { name: /Confirmed/i }).first();
  if (await confirmed.count()) {
    await confirmed.click();
  } else if (await orderLink.count()) {
    await orderLink.click();
  } else {
    fail("order-detail", "No orders found");
  }

  if (!results.some((r) => r.name === "order-detail" && !r.ok)) {
    await page.waitForURL(/\/account\/orders\/[0-9a-f-]+/, { timeout: 20_000 });
    const payment = await page.getByText(/Payment:\s*(Pending|COD|Paid|Failed|Refunded)/i).count();
    const timeline = await page.getByRole("heading", { name: "Order timeline" }).count();
    const placed = await page.getByText("Order Placed").count();
    if (payment && timeline && placed) {
      pass("order-detail", `payment+timeline on ${page.url()}`);
    } else {
      fail("order-detail", `payment=${payment} timeline=${timeline} placed=${placed} url=${page.url()}`);
    }
  }

  // Wishlist persistence
  await page.goto(`${BASE}/products/baby-wipes`, { waitUntil: "domcontentloaded" });
  const wishBtn = page.locator("button.wishlist-btn").first();
  await wishBtn.waitFor({ state: "visible", timeout: 20_000 });
  await page.waitForTimeout(2000);
  const before = await wishBtn.getAttribute("aria-pressed");
  // Ensure added
  if (before !== "true") {
    await wishBtn.click();
    await page.waitForFunction(
      () => document.querySelector("button.wishlist-btn")?.getAttribute("aria-pressed") === "true",
      { timeout: 15_000 },
    );
  }
  // Buy Now must NOT say Redirecting from wishlist
  const buyNowText = await page.getByRole("button", { name: /Buy Now|Redirecting/i }).first().innerText();
  if (/Redirecting/i.test(buyNowText)) {
    fail("wishlist-buy-now-isolation", `Buy Now text=${buyNowText}`);
  } else {
    pass("wishlist-buy-now-isolation", `Buy Now text=${buyNowText.trim()}`);
  }

  const afterAdd = await page.locator("button.wishlist-btn").first().getAttribute("aria-pressed");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => document.querySelector("button.wishlist-btn")?.getAttribute("aria-pressed") === "true",
    { timeout: 20_000 },
  ).catch(() => null);
  const afterRefresh = await page.locator("button.wishlist-btn").first().getAttribute("aria-pressed");
  await page.goto(`${BASE}/wishlist`, { waitUntil: "domcontentloaded" });
  await page.getByText(/Baby Wipes/i).first().waitFor({ state: "visible", timeout: 20_000 }).catch(() => null);
  const hasWipes = await page.getByText(/Baby Wipes/i).count();
  const empty = await page.getByText(/wishlist is empty|no saved items|nothing saved/i).count();

  if (afterAdd === "true" && afterRefresh === "true" && hasWipes > 0 && empty === 0) {
    pass("wishlist-persistence", "survives refresh + /wishlist");
  } else {
    fail(
      "wishlist-persistence",
      `afterAdd=${afterAdd} afterRefresh=${afterRefresh} hasWipes=${hasWipes} empty=${empty}`,
    );
  }

  // Remove
  const removeBtn = page.getByLabel(/Remove .+ from wishlist/i).first();
  try {
    await removeBtn.waitFor({ state: "visible", timeout: 15_000 });
    await removeBtn.click();
    await page.getByText(/Your wishlist is empty/i).first().waitFor({ state: "visible", timeout: 15_000 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByText(/Your wishlist is empty/i).first().waitFor({ state: "visible", timeout: 15_000 });
    pass("wishlist-remove", "empty after remove + refresh");
  } catch (err) {
    fail("wishlist-remove", String(err).slice(0, 200));
  }

  // Logout / login persistence: add again, logout, login, check
  await page.goto(`${BASE}/products/baby-wipes`, { waitUntil: "domcontentloaded" });
  const wb = page.locator("button.wishlist-btn").first();
  await wb.waitFor({ state: "visible" });
  await page.waitForTimeout(2000);
  if ((await wb.getAttribute("aria-pressed")) !== "true") {
    await wb.click();
    await page.waitForFunction(
      () => document.querySelector("button.wishlist-btn")?.getAttribute("aria-pressed") === "true",
      { timeout: 15_000 },
    );
  }
  await page.goto(`${BASE}/account`, { waitUntil: "domcontentloaded" });
  const signOut = page.getByRole("button", { name: /Sign Out/i });
  if (await signOut.count()) {
    await signOut.click();
    await page.waitForURL(/login|\/$/, { timeout: 30_000 });
  }
  await login(page);
  await page.goto(`${BASE}/wishlist`, { waitUntil: "domcontentloaded" });
  await page.getByText(/Baby Wipes/i).first().waitFor({ state: "visible", timeout: 20_000 }).catch(() => null);
  const afterRelogin = await page.getByText(/Baby Wipes/i).count();
  if (afterRelogin > 0) pass("wishlist-logout-login", "item present after re-login");
  else fail("wishlist-logout-login", "missing after re-login");

  // cleanup remove
  const rm = page.getByLabel(/Remove .+ from wishlist/i).first();
  if (await rm.count()) await rm.click();
} catch (err) {
  fail("script", String(err));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log("\nSUMMARY", { pass: results.length - failed.length, fail: failed.length });
process.exit(failed.length ? 1 : 0);
