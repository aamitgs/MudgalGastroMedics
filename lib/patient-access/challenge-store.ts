import "server-only";

import { createHash, randomBytes, randomInt } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { normalizePatientPhone } from "@/lib/patient-access/identity-store";

/**
 * Short-lived login challenges: 6-digit SMS OTPs and email magic-link tokens.
 * Only hashes are stored; codes/tokens live in the delivery channel only.
 */
export type PatientChallenge = {
  id: string;
  kind: "sms-otp" | "magic-link";
  phone: string;
  createdAt: string;
  expiresAt: string;
  secretHash: string;
  attempts: number;
  consumedAt?: string;
};

type ChallengeStore = {
  challenges: PatientChallenge[];
};

const otpTtlMs = 5 * 60 * 1000;
const magicLinkTtlMs = 15 * 60 * 1000;
const maxOtpAttempts = 5;

const globalStore = globalThis as typeof globalThis & {
  __mgmPatientChallengeStore?: ChallengeStore;
};

const storeFile = join(process.cwd(), ".data", "patient-challenges.json");

function readStoreFromDisk(): ChallengeStore {
  if (!existsSync(storeFile)) return { challenges: [] };
  try {
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<ChallengeStore>;
    return { challenges: Array.isArray(parsed.challenges) ? parsed.challenges : [] };
  } catch {
    return { challenges: [] };
  }
}

function writeStoreToDisk(store: ChallengeStore) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, `${JSON.stringify(store, null, 2)}\n`);
}

function getStore() {
  globalStore.__mgmPatientChallengeStore ??= readStoreFromDisk();
  return globalStore.__mgmPatientChallengeStore;
}

function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("base64url");
}

function pruneExpired(store: ChallengeStore) {
  const now = Date.now();
  store.challenges = store.challenges.filter(
    (challenge) => new Date(challenge.expiresAt).getTime() > now - 60 * 60 * 1000
  );
}

export function createOtpChallenge(phone: string) {
  const code = String(randomInt(100000, 1000000));
  const store = getStore();
  pruneExpired(store);
  const challenge: PatientChallenge = {
    id: `CHL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    kind: "sms-otp",
    phone: normalizePatientPhone(phone),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + otpTtlMs).toISOString(),
    secretHash: hashSecret(code),
    attempts: 0
  };
  store.challenges = [challenge, ...store.challenges].slice(0, 500);
  writeStoreToDisk(store);
  return { challenge, code };
}

export function createMagicLinkChallenge(phone: string) {
  const token = randomBytes(32).toString("base64url");
  const store = getStore();
  pruneExpired(store);
  const challenge: PatientChallenge = {
    id: `CHL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    kind: "magic-link",
    phone: normalizePatientPhone(phone),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + magicLinkTtlMs).toISOString(),
    secretHash: hashSecret(token),
    attempts: 0
  };
  store.challenges = [challenge, ...store.challenges].slice(0, 500);
  writeStoreToDisk(store);
  return { challenge, token };
}

export type ChallengeVerification =
  | { ok: true; phone: string }
  | { ok: false; error: string };

export function verifyOtpChallenge(phone: string, code: string): ChallengeVerification {
  const store = getStore();
  const normalized = normalizePatientPhone(phone);
  const now = Date.now();
  const challenge = store.challenges.find(
    (item) =>
      item.kind === "sms-otp" &&
      item.phone === normalized &&
      !item.consumedAt &&
      new Date(item.expiresAt).getTime() > now
  );
  if (!challenge) return { ok: false, error: "No active code for this number. Request a new one." };

  challenge.attempts += 1;
  if (challenge.attempts > maxOtpAttempts) {
    challenge.consumedAt = new Date().toISOString();
    writeStoreToDisk(store);
    return { ok: false, error: "Too many wrong attempts. Request a new code." };
  }

  if (hashSecret(code.replace(/\D/g, "")) !== challenge.secretHash) {
    writeStoreToDisk(store);
    return { ok: false, error: "That code did not match. Check the SMS and try again." };
  }

  challenge.consumedAt = new Date().toISOString();
  writeStoreToDisk(store);
  return { ok: true, phone: challenge.phone };
}

export function verifyMagicLinkChallenge(token: string): ChallengeVerification {
  const store = getStore();
  const now = Date.now();
  const secretHash = hashSecret(token);
  const challenge = store.challenges.find(
    (item) => item.kind === "magic-link" && item.secretHash === secretHash && !item.consumedAt
  );
  if (!challenge) return { ok: false, error: "This sign-in link is invalid or was already used." };
  if (new Date(challenge.expiresAt).getTime() <= now) {
    return { ok: false, error: "This sign-in link has expired. Request a new one." };
  }
  challenge.consumedAt = new Date().toISOString();
  writeStoreToDisk(store);
  return { ok: true, phone: challenge.phone };
}
