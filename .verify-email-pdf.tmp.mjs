import { chromium } from "playwright";

const SCRATCH = "/private/tmp/claude-501/-Users-amitsharma-Downloads-Developer-MudgalGastroMedics/1c954776-6c97-468c-aeb7-f2dd6ee5cc2a/scratchpad";
const BASE = "http://localhost:3000";

const consoleErrors = [];
const pageErrors = [];

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => {
  pageErrors.push(String(err));
});

try {
  console.log("STEP 1: goto /login");
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Choose your workspace", { timeout: 15000 });

  console.log("STEP 2: reveal legacy admin login");
  await page.getByRole("button", { name: /Trouble signing in/i }).click();
  await page.waitForSelector("text=Admin credentials", { timeout: 10000 });

  console.log("STEP 3: fill + submit admin/mgm-admin");
  await page.getByPlaceholder("admin").fill("admin");
  await page.getByPlaceholder("Enter staff password").fill("mgm-admin");
  await page.getByRole("button", { name: /Open Dashboard/i }).click();
  // AdminLogin does window.location.reload() on success
  await page.waitForLoadState("networkidle", { timeout: 20000 });

  console.log("STEP 4: navigate to /admin#module-patients");
  await page.goto(`${BASE}/admin#module-patients`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Try to find the Email PDF button; if patients module doesn't show it, try audit
  let emailBtn = page.getByRole("button", { name: /Email PDF/i });
  let found = await emailBtn.count();
  console.log("Email PDF button count on patients module:", found);

  if (found === 0) {
    console.log("STEP 4b: falling back to /admin#module-audit");
    await page.goto(`${BASE}/admin#module-audit`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    emailBtn = page.getByRole("button", { name: /Email PDF/i });
    found = await emailBtn.count();
    console.log("Email PDF button count on audit module:", found);
  }

  if (found === 0) {
    await page.screenshot({ path: `${SCRATCH}/00-no-button-found.png`, fullPage: true });
    throw new Error("Email PDF button not found on either module");
  }

  // Screenshot the toolbar area showing button order
  console.log("STEP 5: screenshot toolbar (button present)");
  await page.screenshot({ path: `${SCRATCH}/01-toolbar-before-click.png`, fullPage: false });

  // Capture the toolbar HTML/text to confirm button order: Export PDF, Email PDF, Print
  const toolbarText = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button")).filter((b) =>
      /Export PDF|Email PDF|Print|Export CSV/i.test(b.textContent || "")
    );
    return buttons.map((b) => b.textContent?.trim());
  });
  console.log("Toolbar button order:", JSON.stringify(toolbarText));

  console.log("STEP 6: click Email PDF");
  await emailBtn.first().click();

  // wait a moment for toast to appear
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SCRATCH}/02-after-click-toast.png`, fullPage: false });

  // Try to read toast text (sonner toasts typically have role=status or [data-sonner-toast])
  const toastText = await page.evaluate(() => {
    const el = document.querySelector("[data-sonner-toast]");
    return el ? el.textContent : null;
  });
  console.log("Toast text (data-sonner-toast):", toastText);

  // Wait a bit more in case of async network roundtrip then screenshot again
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SCRATCH}/03-after-click-toast-settled.png`, fullPage: false });
  const toastText2 = await page.evaluate(() => {
    const el = document.querySelector("[data-sonner-toast]");
    return el ? el.textContent : null;
  });
  console.log("Toast text settled:", toastText2);

  console.log("CONSOLE ERRORS:", JSON.stringify(consoleErrors, null, 2));
  console.log("PAGE ERRORS:", JSON.stringify(pageErrors, null, 2));
} catch (e) {
  console.error("SCRIPT ERROR:", e);
  await page.screenshot({ path: `${SCRATCH}/99-error.png`, fullPage: true }).catch(() => {});
  console.log("CONSOLE ERRORS SO FAR:", JSON.stringify(consoleErrors, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
