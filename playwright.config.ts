import { defineConfig, devices } from "@playwright/test";

// PW_BASE_URL lets us point at an already-running server (e.g. the dev
// container). Without it, Playwright starts `pnpm dev` itself (used in CI).
const baseURL = process.env.PW_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: { baseURL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PW_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
