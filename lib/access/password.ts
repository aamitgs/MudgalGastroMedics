import "server-only";
import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Password hashing uses Node's built-in scrypt (memory-hard KDF, OWASP-accepted).
 * bcrypt/argon2 were deliberately avoided: both need native binaries that are
 * fragile on serverless runtimes. Format: scrypt:N:r:p:salt:hash (base64url).
 */
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LENGTH, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return `scrypt:${SCRYPT_N}:${SCRYPT_R}:${SCRYPT_P}:${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

export function verifyPassword(password: string, stored: string) {
  const parts = stored.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nStr, rStr, pStr, saltStr, hashStr] = parts;
  try {
    const salt = Buffer.from(saltStr, "base64url");
    const expected = Buffer.from(hashStr, "base64url");
    const actual = scryptSync(password, salt, expected.length, {
      N: Number(nStr),
      r: Number(rStr),
      p: Number(pStr)
    });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/**
 * Common-password blocklist. The full offline HaveIBeenPwned dataset (~40GB of
 * k-anonymity hash ranges) is a deployment-time option documented in
 * docs/access-control.md; this bundled list catches the passwords staff
 * actually pick, plus hospital-specific guessables.
 */
const blockedPasswords = new Set(
  [
    "password", "password1", "password123", "passw0rd", "p@ssword", "p@ssw0rd",
    "123456", "1234567", "12345678", "123456789", "1234567890", "12345678910",
    "qwerty", "qwerty123", "qwertyuiop", "abc123", "abcd1234", "iloveyou",
    "admin", "admin123", "administrator", "root", "letmein", "welcome",
    "welcome1", "welcome123", "monkey", "dragon", "master", "sunshine",
    "princess", "football", "baseball", "superman", "batman", "trustno1",
    "india123", "india@123", "jaihind", "krishna", "ganesha", "hanuman",
    "mudgal", "mudgal123", "gastro", "gastromedics", "hospital", "hospital123",
    "doctor", "doctor123", "nurse123", "reception", "mgm-admin", "mgm-doctor",
    "mgmhospital", "agra123", "sharma123", "deepak123", "amit123"
  ].map((entry) => entry.toLowerCase())
);

export type PasswordValidation = { ok: true } | { ok: false; error: string };

export function validatePassword(password: string, context: { username?: string; name?: string } = {}): PasswordValidation {
  if (password.length < 12) {
    return { ok: false, error: "Password must be at least 12 characters long." };
  }

  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((pattern) => pattern.test(password)).length;
  if (classes < 3) {
    return { ok: false, error: "Password must mix at least three of: lowercase, uppercase, numbers, symbols." };
  }

  const lowered = password.toLowerCase();
  if (blockedPasswords.has(lowered) || [...blockedPasswords].some((blocked) => blocked.length >= 6 && lowered.includes(blocked))) {
    return { ok: false, error: "Password is too common or contains a guessable word. Choose something less predictable." };
  }

  for (const value of [context.username, context.name]) {
    const normalized = value?.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normalized && normalized.length >= 4 && lowered.replace(/[^a-z0-9]/g, "").includes(normalized)) {
      return { ok: false, error: "Password must not contain your name or username." };
    }
  }

  return { ok: true };
}

const tempUpper = "ABCDEFGHJKMNPQRSTUVWXYZ";
const tempLower = "abcdefghjkmnpqrstuvwxyz";
const tempDigits = "23456789";
const tempSymbols = "!@#$%&*+-=?";

/** Generates a 16-character temporary password guaranteed to pass validatePassword. */
export function generateTempPassword() {
  const pick = (alphabet: string, count: number) =>
    Array.from({ length: count }, () => alphabet[randomInt(alphabet.length)]);
  const chars = [
    ...pick(tempUpper, 4),
    ...pick(tempLower, 5),
    ...pick(tempDigits, 4),
    ...pick(tempSymbols, 3)
  ];
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
