import "server-only";

import { sendEmail } from "@/lib/email";
import { site } from "@/lib/site-data";

/**
 * OTP / magic-link delivery adapters.
 *
 * SMS: MSG91 (India-focused; the one approved paid exception to the
 * self-hosted stack, patient-facing only). Inactive until SMS_PROVIDER_KEY and
 * MSG91_TEMPLATE_ID are configured — before that, dev mode surfaces the code
 * to the caller (never in production) so the portal stays usable pre-purchase.
 * NOTE: the first live send after keys arrive should be smoke-tested against
 * MSG91's dashboard before relying on it for patients.
 *
 * Email: routed through lib/email.ts (SMTP_URL-configured, logs instead of
 * sending until that's set).
 */
export type DeliveryResult = { channel: "sms" | "email" | "log"; ok: boolean; error?: string };

function smsConfigured() {
  return Boolean(process.env.SMS_PROVIDER_KEY?.trim() && process.env.MSG91_TEMPLATE_ID?.trim());
}

export function isSmsDeliveryConfigured() {
  return smsConfigured();
}

export async function sendOtpSms(phone: string, code: string): Promise<DeliveryResult> {
  if (!smsConfigured()) {
    console.warn(`[patient-otp] SMS delivery not configured; OTP for ${phone.slice(-4).padStart(phone.length, "*")} not sent.`);
    return { channel: "log", ok: true };
  }

  try {
    const response = await fetch("https://control.msg91.com/api/v5/otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: process.env.SMS_PROVIDER_KEY as string
      },
      body: JSON.stringify({
        template_id: process.env.MSG91_TEMPLATE_ID,
        mobile: `91${phone}`,
        otp: code
      })
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { channel: "sms", ok: false, error: `MSG91 responded ${response.status}: ${text.slice(0, 200)}` };
    }
    return { channel: "sms", ok: true };
  } catch (error) {
    return { channel: "sms", ok: false, error: error instanceof Error ? error.message : "SMS send failed" };
  }
}

export async function sendMagicLinkEmail(email: string, link: string): Promise<DeliveryResult> {
  const result = await sendEmail({
    to: email,
    subject: `Sign in to ${site.shortName} Patient Portal`,
    text: `Use this link to sign in to your patient portal:\n${link}\n\nThis link expires shortly and can only be used once. If you didn't request it, you can ignore this email.`,
    html: `<p>Use the link below to sign in to your patient portal:</p><p><a href="${link}">${link}</a></p><p>This link expires shortly and can only be used once. If you didn't request it, you can ignore this email.</p>`
  });
  if (result.channel === "log") {
    console.warn(`[patient-magic-link] Email delivery not configured; sign-in link for ${email} was generated but not emailed.`);
    console.warn(`[patient-magic-link] ${link}`);
  }
  return result;
}
