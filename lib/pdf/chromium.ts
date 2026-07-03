import "server-only";
import { existsSync } from "node:fs";
import puppeteer, { type Browser } from "puppeteer-core";

function isServerlessRuntime() {
  return Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL || process.env.NETLIFY);
}

const localChromeCandidates = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser"
];

function findLocalChrome() {
  if (process.env.PDF_CHROMIUM_EXECUTABLE_PATH) return process.env.PDF_CHROMIUM_EXECUTABLE_PATH;
  return localChromeCandidates.find((candidate) => existsSync(candidate));
}

export async function launchPdfBrowser(): Promise<Browser> {
  if (process.env.PDF_CHROMIUM_EXECUTABLE_PATH) {
    return puppeteer.launch({
      executablePath: process.env.PDF_CHROMIUM_EXECUTABLE_PATH,
      headless: true
    });
  }

  if (isServerlessRuntime()) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({
      args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
      defaultViewport: { width: 1240, height: 1754 },
      executablePath: await chromium.executablePath(),
      headless: "shell"
    });
  }

  const executablePath = findLocalChrome();
  if (!executablePath) {
    throw new Error(
      "No local Chrome/Chromium executable found for PDF generation. Install Google Chrome, or set PDF_CHROMIUM_EXECUTABLE_PATH to a Chromium binary."
    );
  }

  return puppeteer.launch({ executablePath, headless: true });
}

export async function renderHtmlToPdf(
  html: string,
  options: { headerTemplate: string; footerTemplate: string }
): Promise<Buffer> {
  const browser = await launchPdfBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "a4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: options.headerTemplate,
      footerTemplate: options.footerTemplate,
      margin: { top: "28mm", bottom: "20mm", left: "20mm", right: "20mm" }
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
