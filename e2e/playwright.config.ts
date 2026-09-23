import { defineConfig, devices } from "@playwright/test"

// End-to-end suite against a running stack: Next on :3000, API on :8080, Postgres (cms3).
// Specs are numbered and share state (the org, users and content they create), so they
// run in file order on one worker. See README.md.
export default defineConfig({
  testDir: "./specs",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 240_000,
  expect: { timeout: 15_000 },
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",
  reporter: [["list"], ["html", { open: "never", outputFolder: ".report" }]],
  outputDir: ".results",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
  },
})
