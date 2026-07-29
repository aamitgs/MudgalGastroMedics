import { expect, test } from "@playwright/test";

/**
 * No OS route may scroll horizontally.
 *
 * Staff work these screens for eight to twelve hours a day, and a page that
 * scrolls sideways puts the right-hand columns of a table — status, actions —
 * off the edge on a laptop. Four separate causes of this were fixed across the
 * branch and every one of them was a flex or grid item refusing to shrink
 * below its content, so this asserts the outcome rather than any single rule.
 *
 * It is an end-to-end test rather than a unit one because the defect only
 * exists once real content is measured: the appointments page looked fine
 * against the demo dataset and overflowed by 234px once it held real rows, as
 * an implicit `auto` grid track cannot size below its content.
 */

const ROUTES = [
  "",
  "appointments",
  "patients",
  "patient-flow",
  "opd",
  "ipd",
  "billing",
  "pharmacy",
  "lab",
  "procedures",
  "radiology-pathology",
  "finance",
  "reports",
  "analytics",
  "hr",
  "inventory",
  "audit",
  "access",
  "cms",
  "settings",
  "doctor-workflow",
  "modules",
  "automation",
  "communication",
  "diet-plans",
  "ai-reviews",
  "readiness",
  "staff-notes",
  "notifications"
];

/** 1280 is the common hospital laptop; 1024 is the narrowest the OS shell targets. */
const WIDTHS = [1024, 1280];

/**
 * Tables are what push these pages wide, and an empty table is narrow — so
 * measuring against empty stores would have passed straight through the very
 * bug this file exists to catch. Seeding is therefore part of the assertion,
 * not setup convenience: the names and services are long the way real ones
 * are, because a column sizes to its widest cell.
 */
async function seedRealisticRows(request: import("@playwright/test").APIRequestContext) {
  const rows = [
    { name: "Lakshmi Narayanan Venkataraman", service: "OPD", priority: "Urgent symptoms" },
    { name: "Chandrashekhar Bhattacharya", service: "IPD", priority: "Routine" },
    { name: "Priyadarshini Ramachandran", service: "OPD", priority: "Soon" },
    { name: "Satyanarayana Subramanian", service: "OPD", priority: "Routine" },
    { name: "Vishwanathan Krishnamurthy", service: "IPD", priority: "Urgent symptoms" },
    { name: "Meenakshi Sundareswaran", service: "OPD", priority: "Routine" }
  ];
  await Promise.all(
    rows.map((row, index) =>
      request.post("/api/appointment", {
        data: {
          ...row,
          phone: `9${String(Date.now() + index * 37).slice(-9)}`,
          timeSlot: "Morning (10:00 AM - 1:00 PM)",
          message: "Referred by a general physician for persistent upper abdominal discomfort."
        }
      })
    )
  );
}

for (const width of WIDTHS) {
  test(`no OS route scrolls horizontally at ${width}px`, async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width, height: 900 });
    await page.request.post("/api/admin/session", { data: { username: "admin", password: "mgm-admin" } });
    await seedRealisticRows(page.request);

    const overflowing: string[] = [];
    for (const route of ROUTES) {
      await page.goto(`/mudgalgastromedics-os/${route}`, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      if (overflow > 0) overflowing.push(`${route || "dashboard"} +${overflow}px`);
    }

    // Reported together: one layout regression usually breaks several routes,
    // and fixing them one failure per run wastes the signal.
    expect(overflowing, `horizontal scroll at ${width}px on: ${overflowing.join(", ")}`).toEqual([]);
  });
}
