import "server-only";

import nodemailer from "nodemailer";
import { logServerError } from "@/lib/error-logger";
import { site } from "@/lib/site-data";

/**
 * SMTP email delivery. Self-hosted-agnostic by design (any SMTP server works,
 * not a proprietary API): set SMTP_URL to a nodemailer connection string,
 * e.g. smtps://admin%40mudgalgastromedics.com:PASSWORD@smtpout.secureserver.net:465
 * (percent-encode any @ or : inside the password). Until it's set, sends are
 * logged instead of attempted so dev/staging stays usable without credentials.
 */
export type EmailResult = { channel: "email" | "log"; ok: boolean; error?: string };

function smtpConfigured() {
  return Boolean(process.env.SMTP_URL?.trim());
}

export function isEmailDeliveryConfigured() {
  return smtpConfigured();
}

let cachedTransport: ReturnType<typeof nodemailer.createTransport> | null = null;
function getTransport() {
  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport(process.env.SMTP_URL as string);
  }
  return cachedTransport;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}): Promise<EmailResult> {
  if (!smtpConfigured()) {
    console.warn(`[email] SMTP delivery not configured; email to ${options.to} ("${options.subject}") was not sent.`);
    return { channel: "log", ok: true };
  }

  try {
    await getTransport().sendMail({
      from: `${site.name} <${site.email}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments
    });
    return { channel: "email", ok: true };
  } catch (error) {
    logServerError("email.send", error, { to: options.to, subject: options.subject });
    return { channel: "email", ok: false, error: error instanceof Error ? error.message : "Email send failed" };
  }
}
