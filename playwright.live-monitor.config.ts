import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  expect: { timeout: 8_000 },
  forbidOnly: true,
  fullyParallel: false,
  outputDir: "build/quality-agent/playwright",
  projects: [
    {
      name: "chromium-live-monitor",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: "line",
  retries: 0,
  testDir: "apps/web/tests/live-monitor",
  timeout: 90_000,
  use: {
    baseURL: process.env.MONITOR_BASE_URL ?? "https://waste-app-web.vercel.app",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  workers: 1,
});
