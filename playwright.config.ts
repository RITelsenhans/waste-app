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
    baseURL: "http://127.0.0.1:13000",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "pnpm dev:api",
      env: {
        SERVER_PORT: "18080",
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: "http://127.0.0.1:18080/v1/health/ready",
    },
    {
      command: "pnpm dev:web",
      env: {
        API_BASE_URL: "http://127.0.0.1:18080",
        PORT: "13000",
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: "http://127.0.0.1:13000/demo",
    },
  ],
  workers: isCi ? 1 : undefined,
});
