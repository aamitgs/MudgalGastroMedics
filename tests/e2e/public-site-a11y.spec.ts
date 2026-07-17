import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Axe coverage for the public marketing site (home, contact form, a blog
 * post, a local-area page, a procedure page and the doctor profile) —
 * staff-a11y.spec.ts only covers the OS/staff surfaces plus /portal.
 * color-contrast is disabled to match the existing suite convention.
 */
async function expectNoAxeViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
  expect(results.violations).toEqual([]);
}

test("homepage passes axe checks", async ({ page }) => {
  await page.goto("/");
  await expectNoAxeViolations(page);
});

test("contact page and appointment form pass axe checks", async ({ page }) => {
  await page.goto("/contact");
  await expectNoAxeViolations(page);
});

test("blog post passes axe checks", async ({ page }) => {
  await page.goto("/blog/what-is-fatty-liver-symptoms-causes");
  await expectNoAxeViolations(page);
});

test("local area page passes axe checks", async ({ page }) => {
  await page.goto("/areas/gastroenterologist-in-mathura");
  await expectNoAxeViolations(page);
});

test("procedure page passes axe checks", async ({ page }) => {
  await page.goto("/procedures/endoscopy");
  await expectNoAxeViolations(page);
});

test("doctor profile page passes axe checks", async ({ page }) => {
  await page.goto("/dr-deepak-kumar-sharma-gastroenterologist-agra");
  await expectNoAxeViolations(page);
});
