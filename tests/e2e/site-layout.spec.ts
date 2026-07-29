import { expect, test } from "@playwright/test";

/**
 * No public route may scroll horizontally on a phone.
 *
 * WCAG 2.1 SC 1.4.10 (Reflow) is written against a 320px viewport, and this
 * is the half of the product patients actually use — they book on phones. Six
 * routes failed this at 320px and three at 390px before it was fixed, from two
 * causes that both come down to content refusing to shrink: hero headings
 * pinned at a desktop size from the smallest breakpoint up, and a grid with no
 * columns declared falling back to an implicit `auto` track.
 *
 * Long medical vocabulary is what makes this a recurring risk rather than a
 * one-off: "Gastroenterology," needs 447px at 48px type, so any new heading
 * with a long word reintroduces the defect. Asserting the outcome catches that
 * regardless of which of the two causes produces it.
 */

const ROUTES = [
  "/",
  "/about",
  "/ai-planning",
  "/areas",
  "/blog",
  "/contact",
  "/cookie-policy",
  "/dr-deepak-kumar-sharma-gastroenterologist-agra",
  "/duty-doctor",
  "/faqs",
  "/life-at-mgm",
  "/operations",
  "/patient-portal",
  "/patient-rights-responsibilities",
  "/platform",
  "/privacy",
  "/procedures",
  "/services",
  "/gallery",
  "/terms",
  "/disclaimer",
  "/portal",
  "/blog/stomach-intestine-liver-consultation-check-up-camp"
];

/** 320 is the WCAG reflow width; 390 is an ordinary iPhone. */
const WIDTHS = [320, 390];

for (const width of WIDTHS) {
  test(`no public route scrolls horizontally at ${width}px`, async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width, height: 800 });

    const overflowing: string[] = [];
    const didNotRender: string[] = [];

    for (const route of ROUTES) {
      const response = await page.goto(route, { waitUntil: "networkidle" });
      const health = await page.evaluate(() => ({
        hasMain: Boolean(document.querySelector("main")),
        hasH1: Boolean(document.querySelector("h1")?.textContent?.trim()),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
      }));

      // A page that failed to build has nothing to overflow, so a broken page
      // would measure as a perfect one. Prove it rendered before trusting the
      // number. `goto` returns null on a cached navigation, so the DOM is the
      // signal rather than the response object.
      if ((response !== null && !response.ok()) || !health.hasMain || !health.hasH1) {
        didNotRender.push(route);
        continue;
      }
      if (health.overflow > 0) overflowing.push(`${route} +${health.overflow}px`);
    }

    expect(didNotRender, `did not render, so the measurement is void: ${didNotRender.join(", ")}`).toEqual([]);
    expect(overflowing, `horizontal scroll at ${width}px on: ${overflowing.join(", ")}`).toEqual([]);
  });
}
