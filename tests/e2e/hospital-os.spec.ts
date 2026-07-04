import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

test.beforeEach(async ({ page }) => {
  await page.request.post("/api/admin/session", { data: { username: "admin", password: "mgm-admin" } });
});

test("patient registration, appointment booking, and billing flows pass with axe checks", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os");
  await expect(page.getByText(/clean operating telemetry/i)).toBeVisible();

  await page.getByLabel("First name").fill("Rahul");
  await page.getByLabel("Last name").fill("Gupta");
  await page.getByLabel("Mobile").fill("9876543210");
  await page.getByRole("spinbutton", { name: "Age" }).fill("38");
  await page.getByLabel("Concern").fill("Persistent reflux and abdominal discomfort");
  await page.getByRole("button", { name: /register patient/i }).click();
  await expect(page.getByText("Patient registration saved.")).toBeVisible();
  await expect(page.getByText("hospital_os.patient.registered")).toBeVisible();

  await page.getByRole("textbox", { name: "Patient UHID", exact: true }).fill("MGM-24018");
  await page.getByLabel("Appointment reason").fill("Follow-up consultation after lab review");
  await page.getByRole("button", { name: /book appointment/i }).click();
  await expect(page.getByText("Appointment booked.")).toBeVisible();
  await expect(page.getByText("hospital_os.appointment.booked")).toBeVisible();

  await page.getByLabel("Invoice ID").fill("INV-9001");
  await page.getByLabel("Billing patient UHID").fill("MGM-24018");
  await page.getByLabel("Amount").fill("18450");
  await page.getByLabel("Billing notes").fill("Insurance preauthorization review completed");
  await page.getByRole("button", { name: /post billing/i }).click();
  await expect(page.getByText("Billing posted.")).toBeVisible();
  await expect(page.getByText("hospital_os.billing.posted")).toBeVisible();

  const accessibilityScanResults = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test("command palette searches direct records with keyboard shortcut", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os");
  await expect(page.getByText(/clean operating telemetry/i)).toBeVisible();
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
  });
  await page.getByPlaceholder(/search patient/i).fill("LFT");
  await expect(page.getByText("LFT panel", { exact: true })).toBeVisible();
  await page.getByText("LFT panel", { exact: true }).click();
  await expect(page).toHaveURL(/#patient-workspace/);
  await expect(page.getByLabel("Filter patient flow table")).toHaveValue("");
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

test("doctor workspace autosaves clinical notes", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os");
  await expect(page.getByText(/single-screen consultation/i)).toBeVisible();
  await page.getByLabel("Select Nisha Verma consultation").click();
  await expect(page.getByText("Clinical notes for Nisha Verma")).toBeVisible();
  await page.getByLabel("Clinical notes for Nisha Verma").fill("Patient reports reduced pain. Continue observation and review LFT trend.");
  await expect(page.getByText("Unsaved changes")).toBeVisible();
  await expect(page.getByText("Autosaving...")).toBeVisible();
  await expect(page.getByText(/Autosaved at/i)).toBeVisible();
  await expect(page.getByText("hospital_os.clinical_notes.autosaved")).toBeVisible();
  await expect(page.getByText("patient: MGM-24019")).toBeVisible();
});

test("doctor workspace queue supports keyboard navigation", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os");
  await expect(page.getByText(/single-screen consultation/i)).toBeVisible();
  const firstQueueItem = page.getByLabel("Select Aarav Sharma consultation");
  await firstQueueItem.focus();
  await firstQueueItem.dispatchEvent("keydown", { key: "ArrowDown", bubbles: true });
  await expect.poll(async () => page.evaluate(() => document.activeElement?.getAttribute("aria-label"))).toBe("Select Nisha Verma consultation");
  await page.locator("[aria-label='Select Nisha Verma consultation']").dispatchEvent("keydown", { key: "Enter", bubbles: true });
  await expect(page.getByText("Clinical notes for Nisha Verma")).toBeVisible();
});

test("doctor workspace confirms AI prescription suggestion", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os");
  await expect(page.getByText("AI prescription assistance", { exact: true })).toBeVisible();
  await expect(page.getByText(/Suggestion only/i)).toBeVisible();
  await page.getByRole("button", { name: "Confirm Suggestion" }).click();
  await expect(page.getByText("Doctor confirmed AI suggestion.")).toBeVisible();
  await expect(page.getByText("hospital_os.ai_prescription.confirmed")).toBeVisible();
  await page.getByLabel("Select Nisha Verma consultation").click();
  await expect(page.getByText("Clinical notes for Nisha Verma")).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm Suggestion" })).toBeEnabled();
});

test("patient portal symptom checker stays informational", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os");
  await expect(page.getByText("Informational guidance")).toBeVisible();
  await expect(page.getByText("Not a diagnosis")).toBeVisible();
  await page.getByRole("button", { name: "Review Symptoms" }).click();
  await expect(page.getByText("Enter a short symptom note before reviewing.")).toBeVisible();
  await page.getByLabel("Patient symptom note").fill("Mild abdominal pain after meals for two days");
  await expect(page.getByText("Enter a short symptom note before reviewing.")).toHaveCount(0);
  await page.getByRole("button", { name: "Review Symptoms" }).click();
  await expect(page.getByText(/keep tracking symptoms/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Start Teleconsultation" })).toHaveCount(0);
  await page.getByLabel("Patient symptom note").fill("Severe abdominal pain with vomiting");
  await page.getByRole("button", { name: "Review Symptoms" }).click();
  await expect(page.getByText(/urgent attention/i)).toBeVisible();
  await expect(page.getByText(/contact the hospital care team now/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Start Teleconsultation" })).toBeVisible();
  await page.getByRole("button", { name: "Start Teleconsultation" }).click();
  await expect(page.getByRole("heading", { name: "Teleconsultation request" })).toBeVisible();
  await expect(page.getByLabel("Teleconsultation symptom note")).toHaveValue("Severe abdominal pain with vomiting");
  await page.getByRole("button", { name: "Request Teleconsultation" }).click();
  await expect(page.getByText("Teleconsultation request sent.")).toBeAttached();
  await expect(page.getByText("hospital_os.teleconsultation.requested")).toBeVisible();
  await expect(page.getByText("Not a diagnosis")).toBeVisible();
});

test("patient flow table exports CSV", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os");
  await expect(page.getByText(/active patient flow/i)).toBeVisible();
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
  await page.goto("/mudgalgastromedics-os");
  await expect(page.getByText(/active patient flow/i)).toBeVisible();
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
  await page.goto("/mudgalgastromedics-os");
  await expect(page.getByText(/active patient flow/i)).toBeVisible();
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
  await page.goto("/mudgalgastromedics-os");
  await expect(page.getByText(/active patient flow/i)).toBeVisible();
  await expect(page.getByText(/showing 4 of 6/i)).toBeVisible();
  await expect(page.getByRole("row", { name: /Kavya Mehta/i })).toHaveCount(0);
  await page.getByLabel("Rows per patient flow page").selectOption("6");
  await expect(page.getByText(/showing 6 of 6/i)).toBeVisible();
  await expect(page.getByRole("row", { name: /Kavya Mehta/i })).toBeVisible();
});

test("patient flow table supports keyboard row navigation", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os");
  await expect(page.getByText(/active patient flow/i)).toBeVisible();
  const firstRow = page.getByLabel("Open Aarav Sharma row");
  await firstRow.focus();
  await firstRow.dispatchEvent("keydown", { key: "ArrowDown", bubbles: true });
  await expect.poll(async () => page.evaluate(() => document.activeElement?.getAttribute("aria-label"))).toBe("Open Nisha Verma row");
  await page.locator("[aria-label='Open Nisha Verma row']").dispatchEvent("keydown", { key: "Enter", bubbles: true });
  await expect(page.getByText(/Nisha Verma\s+MGM-24019/)).toBeVisible();
});

test("patient flow row action opens patient workspace", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os");
  await expect(page.getByText(/active patient flow/i)).toBeVisible();
  await page.getByRole("button", { name: "Open actions for Imran Khan" }).click();
  await page.getByRole("menuitem", { name: "Open patient workspace" }).click();
  await expect(page.getByText(/Imran Khan\s+MGM-24020/)).toBeVisible();
});

test("patient flow row action assigns doctor", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os");
  await expect(page.getByText(/active patient flow/i)).toBeVisible();
  await page.getByRole("button", { name: "Open actions for Imran Khan" }).click();
  await page.getByRole("menuitem", { name: "Assign doctor" }).click();
  await expect(page.getByRole("heading", { name: "Assign doctor" })).toBeVisible();
  await page.getByLabel("Assigned doctor").selectOption("Dr. Neha Bansal");
  await page.getByRole("button", { name: "Save Assignment" }).click();
  const row = page.getByRole("row", { name: /Imran Khan/i });
  await expect(row.getByText("Dr. Neha Bansal")).toBeVisible();
  await expect(page.getByText("hospital_os.patient_flow.doctor_assigned")).toBeVisible();
});

test("patient flow row action exports a single row", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os");
  await expect(page.getByText(/active patient flow/i)).toBeVisible();
  await page.getByRole("button", { name: "Open actions for Imran Khan" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export row" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("hospital-os-patient-flow-imran-khan.csv");
  const path = await download.path();
  expect(path).toBeTruthy();
  const csv = readFileSync(path!, "utf8");
  expect(csv).toContain("Imran Khan");
  expect(csv).not.toContain("Aarav Sharma");
});

test("patient flow table applies bulk action to selected rows", async ({ page }) => {
  await page.goto("/mudgalgastromedics-os");
  await expect(page.getByText(/active patient flow/i)).toBeVisible();
  await page.getByLabel("Select Nisha Verma", { exact: true }).click();
  await expect(page.getByRole("button", { name: /bulk action \(1\)/i })).toBeEnabled();
  await page.getByRole("button", { name: /bulk action \(1\)/i }).click();
  await expect(page.getByText("1 patient flow row scheduled.")).toBeVisible();
  await expect(page.getByText("hospital_os.patient_flow.bulk_updated")).toBeVisible();
  const row = page.getByRole("row", { name: /Nisha Verma/i });
  await expect(row.getByText("Scheduled")).toBeVisible();
});
