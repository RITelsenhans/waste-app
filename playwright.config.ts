import { defineConfig, devices } from "@playwright/test";

const isCi = Boolean(process.env.CI);

export default defineConfig({
  expect: {
    timeout: 5_000,
  },
  forbidOnly: isCi,
  fullyParallel: true,
  outputDir: "build/playwright-results",
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "chromium-mobile",
      use: {
        ...devices["Pixel 7"],
      },
    },
  ],
  reporter: isCi
    ? [["line"], ["html", { open: "never", outputFolder: "build/playwright-report" }]]
    : "line",
  retries: isCi ? 1 : 0,
  testDir: "apps/web/tests/browser",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:13000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "exec node tooling/scripts/dev.mjs",
    env: {
      ADMIN_PORT: "13001",
      NEXT_DIST_DIR: ".next-playwright",
      MAIL_SMTP_PORT: "11025",
      MAIL_UI_PORT: "18025",
      PORT: "13000",
      POSTGRES_PORT: "55434",
      SERVER_PORT: "18080",
    },
    reuseExistingServer: false,
    gracefulShutdown: { signal: "SIGTERM", timeout: 10_000 },
    timeout: 120_000,
    url: "http://127.0.0.1:13000/demo",
  },
  workers: isCi ? 1 : undefined,
});
