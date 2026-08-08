import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry"
  },
  webServer: {
    // Separate NEXT_DIST_DIR so this can run alongside a normal `npm run dev`
    // on port 3000 without Next's single-instance-per-project lock conflicting.
    // Must use `localhost`, not `127.0.0.1`: Next 16's allowedDevOrigins guard
    // blocks cross-origin dev resources (webpack-hmr, client bundle pipeline)
    // when accessed via the raw loopback IP, so pages server-render fine but
    // never hydrate — every click/form silently falls back to native submit.
    // The suite's environment is pinned here rather than inherited from
    // .env.local, for two independent reasons:
    //
    //   DATA_SOURCE/DATABASE_URL — the suite registers patients, books OPD
    //   visits and settles invoices. A developer's .env.local points at the
    //   hospital's Postgres (it has to, for the production-readiness checks),
    //   so inheriting it would write test patients into live clinical data.
    //
    //   ADMIN_USERNAME/ADMIN_PASSWORD/ADMIN_PASSCODE — every spec authenticates
    //   with the documented dev default admin/mgm-admin (lib/staff-auth.ts).
    //   Any real ADMIN_PASSWORD in .env.local silently replaces that, and the
    //   whole OS suite then fails on unrendered pages rather than on a clear
    //   auth error.
    command: [
      "NEXT_DIST_DIR=.next-e2e",
      "DATA_SOURCE=local-json",
      "DATABASE_URL=",
      "ADMIN_USERNAME=admin",
      "ADMIN_PASSWORD=mgm-admin",
      "ADMIN_PASSCODE=",
      "npm run dev -- --hostname localhost --port 3100"
    ].join(" "),
    url: "http://localhost:3100/mudgalgastromedics-os",
    reuseExistingServer: true,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // Billing and layout are split out below and must not run inside this
      // project — both seed real data the demo-dataset specs cannot tolerate.
      testIgnore: /(billing|os-layout)\.spec\.ts/
    },
    {
      // Seeds real appointments so the tables it measures are the width they
      // are in a working hospital. An empty table is narrow and would pass
      // straight through the overflow this suite exists to catch, so the
      // seeding has the same demo-dataset conflict billing does.
      name: "layout",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /os-layout\.spec\.ts/,
      // After billing, not merely after chromium. Projects sharing a single
      // dependency run in parallel, so measuring layout while the billing
      // specs were still creating invoices made this race the data it was
      // measuring. Running last also means it measures the fullest tables,
      // which is the stronger test.
      dependencies: ["chromium", "billing"]
    },
    {
      // The billing specs bill against real OPD visits, which they create.
      // The patient-flow specs assert against the deterministic demo dataset,
      // and the snapshot API only serves that while no real OPD data exists
      // (see tests/e2e/global-setup.ts). So billing runs last, after those
      // have made their assertions — expressed as a dependency rather than
      // relying on filenames sorting the right way.
      name: "billing",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /billing\.spec\.ts/,
      dependencies: ["chromium"]
    }
  ]
});
