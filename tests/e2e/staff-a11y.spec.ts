import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Axe coverage for the staff entry and operations surfaces plus the public
 * patient portal — previously only /hospital-os flows were checked.
 * color-contrast is disabled to match the existing suite convention.
 */
async function expectNoAxeViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
  expect(results.violations).toEqual([]);
}

test("workspace launcher and staff login pass axe checks", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Choose your workspace")).toBeVisible();
  await expectNoAxeViolations(page);

  await page.getByRole("button", { name: /Pharmacy/ }).click();
  await expect(page.getByLabel("Username")).toBeVisible();
  await expectNoAxeViolations(page);
});

test("operations dashboard passes axe checks", async ({ page }) => {
  test.setTimeout(120_000);
  await page.request.post("/api/admin/session", { data: { username: "admin", password: "mgm-admin" } });
  // /admin is retired (Track 4.13, docs/build-roadmap.md) — it redirects to
  // the Hospital OS dashboard, which now carries the per-role "Today" band
  // that used to live on /admin (RoleTodayBand, ported over as part of the
  // retirement so no functionality was lost).
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/mudgalgastromedics-os$/, { timeout: 60_000 });
  await expect(page.getByText("Hospital today")).toBeVisible({ timeout: 60_000 });
  await expectNoAxeViolations(page);
});

test("patient portal passes axe checks", async ({ page }) => {
  await page.goto("/portal");
  await expect(page.getByText("Choose the care type", { exact: false }).first()).toBeVisible({ timeout: 60_000 });
  await expectNoAxeViolations(page);
});
