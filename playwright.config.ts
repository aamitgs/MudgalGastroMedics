import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry"
  },
  webServer: {
    // Separate NEXT_DIST_DIR so this can run alongside a normal `npm run dev`
    // on port 3000 without Next's single-instance-per-project lock conflicting.
    command: "NEXT_DIST_DIR=.next-e2e npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/mudgalgastromedics-os",
    reuseExistingServer: true,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
