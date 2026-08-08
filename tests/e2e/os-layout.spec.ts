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

/**
 * A table that scrolls sideways must say so on a phone.
 *
 * The OS keeps full column sets on mobile rather than hiding columns, so the
 * stock list and its peers scroll horizontally by design — but the rightmost
 * visible column then looks like the last column, and staff never discover
 * the rest. This asserts the cue exists and tracks scroll position.
 *
 * It is measured in a browser because the first attempt at this fix was
 * attached to the wrong element: `<Table>` renders its own overflow-x-auto
 * container, so a scroll region added around it never receives the horizontal
 * scroll and the affordance silently never rendered.
 */
test("a horizontally scrollable table shows an off-screen column cue on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.request.post("/api/admin/session", { data: { username: "admin", password: "mgm-admin" } });
  await page.goto("/mudgalgastromedics-os/inventory", { waitUntil: "networkidle" });

  const container = page.locator('[data-slot="table-container"]').first();
  await expect(container).toBeVisible();

  // Guard the premise: if the table ever stops overflowing at this width the
  // assertions below would pass vacuously.
  const overflow = await container.evaluate((node) => node.scrollWidth - node.clientWidth);
  expect(overflow, "stock table is expected to overflow at 390px").toBeGreaterThan(0);

  await expect(page.locator('[data-scroll-hint="right"]')).toBeVisible();
  await expect(page.locator('[data-scroll-hint="text"]')).toBeVisible();
  // Nothing is hidden to the left until the user has actually scrolled.
  await expect(page.locator('[data-scroll-hint="left"]')).toHaveCount(0);

  await container.evaluate((node) => { node.scrollLeft = node.scrollWidth; });
  await expect(page.locator('[data-scroll-hint="left"]')).toBeVisible();
  await expect(page.locator('[data-scroll-hint="right"]')).toHaveCount(0);
});

test("the off-screen column cue stays out of the way on a desktop width", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.request.post("/api/admin/session", { data: { username: "admin", password: "mgm-admin" } });
  await page.goto("/mudgalgastromedics-os/inventory", { waitUntil: "networkidle" });

  // The swipe wording is touch-specific; the fades may still apply if the
  // table is wide, but the instruction must not reach a mouse user.
  await expect(page.locator('[data-scroll-hint="text"]')).toBeHidden();
});
