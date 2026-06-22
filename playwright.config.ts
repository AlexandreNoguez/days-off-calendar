import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const explicitBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = explicitBaseURL ?? `http://127.0.0.1:${port}`;

if (!explicitBaseURL) {
  process.env.MONGODB_DB_NAME ??= "escala_folga_e2e";
  process.env.NUTRI_DEMO_TOOLS_ENABLED ??= "false";
  process.env.NUTRI_DEMO_TOOLS_ALLOW_PRODUCTION ??= "false";
}

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global.setup.ts",
  globalTeardown: "./tests/e2e/global.teardown.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: explicitBaseURL
    ? undefined
    : {
        command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
          NUTRI_DEMO_TOOLS_ENABLED: process.env.NUTRI_DEMO_TOOLS_ENABLED ?? "false",
          NUTRI_DEMO_TOOLS_ALLOW_PRODUCTION:
            process.env.NUTRI_DEMO_TOOLS_ALLOW_PRODUCTION ?? "false",
        },
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
