import { defineConfig, devices } from "@playwright/test";
import {
  TEST_ACCESS_PASSWORD,
  TEST_SESSION_SECRET,
} from "./apps/web/tests/demo-auth-browser/fixture";

const isCi = Boolean(process.env.CI);

export default defineConfig({
  expect: { timeout: 5_000 },
  forbidOnly: isCi,
  fullyParallel: false,
  outputDir: "build/playwright-demo-auth-results",
  projects: [
    {
      name: "chromium-demo-auth",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: isCi
    ? [["line"], ["html", { open: "never", outputFolder: "build/playwright-demo-auth-report" }]]
    : "line",
  retries: isCi ? 1 : 0,
  testDir: "apps/web/tests/demo-auth-browser",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:14000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "exec node tooling/scripts/codespace-dev.mjs",
    env: {
      ADMIN_PORT: "14001",
      DEMO_ACCESS_PASSWORD: TEST_ACCESS_PASSWORD,
      DEMO_COOKIE_SECURE: "false",
      DEMO_SESSION_SECRET: TEST_SESSION_SECRET,
      NEXT_DIST_DIR: ".next-demo-auth-playwright",
      PORT: "14000",
      POSTGRES_PORT: "55435",
      SERVER_PORT: "18081",
    },
    gracefulShutdown: { signal: "SIGTERM", timeout: 10_000 },
    reuseExistingServer: false,
    timeout: 120_000,
    url: "http://127.0.0.1:14000/login",
  },
  workers: 1,
});
