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
  await page.goto("/admin");
  await expect(page.getByText("Reception & operations dashboard")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("Users, roles & approvals")).toBeVisible({ timeout: 30_000 });
  await expectNoAxeViolations(page);
});

test("patient portal passes axe checks", async ({ page }) => {
  await page.goto("/portal");
  await expect(page.getByText("Choose the care type", { exact: false }).first()).toBeVisible({ timeout: 60_000 });
  await expectNoAxeViolations(page);
});
