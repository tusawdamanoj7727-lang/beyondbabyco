import { defineConfig, devices } from "@playwright/test";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://beyondbabyco.in";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? siteUrl,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: `${process.env.PLAYWRIGHT_BASE_URL ?? siteUrl}/api/health/memory`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
