import "server-only";
import { generate, generateSecret, generateURI, verify } from "otplib";
import { site } from "@/lib/site-data";

export async function createTotpSecret() {
  return generateSecret();
}

export function buildTotpUri(secret: string, username: string) {
  return generateURI({ secret, issuer: site.shortName, label: username });
}

export async function verifyTotpCode(secret: string, token: string) {
  const cleaned = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  try {
    const result = await verify({ token: cleaned, secret });
    return result.valid;
  } catch {
    return false;
  }
}

/** Test-support helper: generates the current code for a secret. */
export async function generateTotpCode(secret: string) {
  return generate({ secret });
}
