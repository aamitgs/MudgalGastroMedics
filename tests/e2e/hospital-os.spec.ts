import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

test.beforeEach(async ({ page }) => {
  await page.request.post("/api/admin/session", { data: { username: "admin", password: "mgm-admin" } });
});

test("dashboard passes axe checks", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os");
  await expect(page.getByText(/clean operating telemetry/i)).toBeVisible();

  const accessibilityScanResults = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test("command palette searches real staff/patient/appointment records via /api/search", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os");
  await expect(page.getByText(/clean operating telemetry/i)).toBeVisible();
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
  });
  const searchResponse = page.waitForResponse((response) => response.url().includes("/api/search?q="));
  await page.getByPlaceholder(/search patient, doctor/i).fill("Deepak");
  const response = await searchResponse;
  expect(response.ok()).toBe(true);
  await expect(page.getByText("Dr. Deepak Kumar Sharma")).toBeVisible();
});

test("keyboard shortcuts modal documents global shortcuts", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os");
  await expect(page.getByText(/clean operating telemetry/i)).toBeVisible();
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "?", shiftKey: true, bubbles: true }));
  });
  await expect(page.getByRole("heading", { name: "Keyboard shortcuts" })).toBeVisible();
  await expect(page.getByText("Open command palette")).toBeVisible();
  await expect(page.getByText("Move through sidebar items")).toBeVisible();
});

test("patient registration, then row click opens the Global Patient Drawer", async ({ page }) => {
  // Regression guard: <PatientDrawer/> used to only be mounted inside
  // StaffChrome.tsx (the Doctor Portal shell), so every openDrawer() call
  // from a /mudgalgastromedics-os/* module's row click silently did nothing.
  // Now mounted on HospitalOsShell too.
  await page.goto("/mudgalgastromedics-os/patients");
  await expect(page.getByRole("heading", { name: "Patient List" })).toBeVisible();

  // Unique phone per run so repeat/local runs never collide with a
  // previously-created record and hit the duplicate-match confirmation flow.
  const phone = `9${Date.now().toString().slice(-9)}`;
  await page.getByLabel("Patient name").fill("Rahul Gupta");
  await page.getByLabel("Mobile number").fill(phone);
  await page.getByRole("button", { name: /save patient/i }).click();

  const patientLink = page.getByRole("button", { name: "Rahul Gupta", exact: true });
  await expect(patientLink).toBeVisible();
  await patientLink.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByText("Rahul Gupta")).toBeVisible();
});

test("patient flow table exports CSV", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os/patient-flow");
  await expect(page.getByText(/active patient flow/i)).toBeVisible();
  // "Active patient flow" is static header text, rendered before the
  // snapshot query resolves — wait for an actual row so Export CSV doesn't
  // race the fetch and download a header-only file.
  await expect(page.getByRole("row", { name: /Aarav Sharma/i })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /export csv/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("hospital-os-patient-flow.csv");
  const path = await download.path();
  expect(path).toBeTruthy();
  const csv = readFileSync(path!, "utf8");
  expect(csv).toContain("Kavya Mehta");
  await expect(page.getByText(/showing 4 of 6/i)).toBeVisible();
});

test("patient flow table exports Excel-compatible file", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os/patient-flow");
  await expect(page.getByText(/active patient flow/i)).toBeVisible();
  await expect(page.getByRole("row", { name: /Aarav Sharma/i })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /export excel/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("hospital-os-patient-flow.xls");
  const path = await download.path();
  expect(path).toBeTruthy();
  const workbookHtml = readFileSync(path!, "utf8");
  expect(workbookHtml).toContain("<table>");
  expect(workbookHtml).toContain("Kavya Mehta");
});

test("patient flow table filters by status column", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os/patient-flow");
  await expect(page.getByText(/active patient flow/i)).toBeVisible();
  // Wait for the snapshot query to actually resolve before touching the
  // filter — selecting against a still-empty/pre-hydration table risks the
  // filter value being set before there's any data for it to apply to.
  await expect(page.getByRole("row", { name: /Aarav Sharma/i })).toBeVisible();
  await page.getByLabel("Filter patient flow status").selectOption("Vitals Pending");
  await expect(page.getByRole("row", { name: /Nisha Verma/i })).toBeVisible();
  await expect(page.getByRole("row", { name: /Aarav Sharma/i })).toHaveCount(0);
  await expect(page.getByText(/showing 1 of 1/i)).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /export csv/i }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  const csv = readFileSync(path!, "utf8");
  expect(csv).toContain("Nisha Verma");
  expect(csv).not.toContain("Aarav Sharma");
});

test("patient flow table changes rows per page", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os/patient-flow");
  await expect(page.getByText(/active patient flow/i)).toBeVisible();
  await expect(page.getByText(/showing 4 of 6/i)).toBeVisible();
  await expect(page.getByRole("row", { name: /Kavya Mehta/i })).toHaveCount(0);
  await page.getByLabel("Rows per patient flow page").selectOption("6");
  await expect(page.getByText(/showing 6 of 6/i)).toBeVisible();
  await expect(page.getByRole("row", { name: /Kavya Mehta/i })).toBeVisible();
});

test("patient flow table supports keyboard row navigation", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os/patient-flow");
  await expect(page.getByText(/active patient flow/i)).toBeVisible();
  const firstRow = page.getByLabel("Open Aarav Sharma row");
  await firstRow.focus();
  await firstRow.dispatchEvent("keydown", { key: "ArrowDown", bubbles: true });
  await expect.poll(async () => page.evaluate(() => document.activeElement?.getAttribute("aria-label"))).toBe("Open Nisha Verma row");
  await page.locator("[aria-label='Open Nisha Verma row']").dispatchEvent("keydown", { key: "Enter", bubbles: true });
  await expect(page.getByText(/Nisha Verma\s+MGM-24019/)).toBeVisible();
});

test("patient flow row action opens patient workspace", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os/patient-flow");
  await expect(page.getByText(/active patient flow/i)).toBeVisible();
  // The patient's name is its own button (no row-action dropdown here) —
  // matched by the leading name so it doesn't also catch the row's
  // "Preview Imran Khan" / "Export Imran Khan" icon buttons.
  await page.getByRole("button", { name: /^Imran Khan/ }).click();
  await expect(page.getByText(/Imran Khan\s+MGM-24020/)).toBeVisible();
});

test("patient flow row action exports a single row", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os/patient-flow");
  await expect(page.getByText(/active patient flow/i)).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Imran Khan" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("hospital-os-patient-flow-imran-khan.csv");
  const path = await download.path();
  expect(path).toBeTruthy();
  const csv = readFileSync(path!, "utf8");
  expect(csv).toContain("Imran Khan");
  expect(csv).not.toContain("Aarav Sharma");
});

test("Doctor Portal lives under /mudgalgastromedics-os/* and the old /doctor route is retired", async ({ page }) => {
  const response = await page.goto("/mudgalgastromedics-os/doctor-portal");
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole("heading", { name: "Clinical workspace" })).toBeVisible();

  const retiredResponse = await page.goto("/doctor");
  expect(retiredResponse?.status()).toBe(404);
});
