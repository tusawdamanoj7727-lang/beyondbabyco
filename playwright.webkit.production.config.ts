import { defineConfig, devices } from "@playwright/test";

import { loadProductionEnv } from "./tests/e2e/helpers/load-production-env";

loadProductionEnv();

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  workers: 1,
  use: {
    baseURL: "https://beyondbabyco.in",
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "webkit-iphone",
      use: { ...devices["iPhone 13"], browserName: "webkit" },
      testMatch: /production-audit\.spec\.ts|mobile\.spec\.ts|search\.spec\.ts/,
    },
    {
      name: "webkit-ipad",
      use: { ...devices["iPad (gen 7)"], browserName: "webkit" },
      testMatch: /production-audit\.spec\.ts|mobile\.spec\.ts/,
    },
  ],
});
