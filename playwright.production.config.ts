import { defineConfig, devices } from "@playwright/test";

import { loadProductionEnv } from "./tests/e2e/helpers/load-production-env";

loadProductionEnv();
process.env.PLAYWRIGHT_PRODUCTION = "1";

/** Production E2E — targets https://beyondbabyco.in with no local webServer. */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  outputDir: "test-results/playwright",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/playwright-results.json" }],
  ],
  use: {
    baseURL: "https://beyondbabyco.in",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    navigationTimeout: 45_000,
    actionTimeout: 20_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
      testMatch: /mobile\.spec\.ts|accessibility\.spec\.ts/,
    },
  ],
});
