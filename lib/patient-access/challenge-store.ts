import "server-only";

import { createHash, randomBytes, randomInt } from "node:crypto";
import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";
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

const store = createDocumentStore<ChallengeStore>("patient-challenges", (parsed) => {
  const doc = parsed as Partial<ChallengeStore> | undefined;
  return { challenges: Array.isArray(doc?.challenges) ? (doc.challenges as PatientChallenge[]) : [] };
});

function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("base64url");
}

function pruneExpired(doc: ChallengeStore) {
  const now = Date.now();
  doc.challenges = doc.challenges.filter(
    (challenge) => new Date(challenge.expiresAt).getTime() > now - 60 * 60 * 1000
  );
}

export async function createOtpChallenge(phone: string) {
  const code = String(randomInt(100000, 1000000));
  const doc = await store.load();
  pruneExpired(doc);
  const challenge: PatientChallenge = {
    id: generateId("CHL", 4),
    kind: "sms-otp",
    phone: normalizePatientPhone(phone),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + otpTtlMs).toISOString(),
    secretHash: hashSecret(code),
    attempts: 0
  };
  doc.challenges = [challenge, ...doc.challenges].slice(0, 500);
  await store.save(doc);
  return { challenge, code };
}

export async function createMagicLinkChallenge(phone: string) {
  const token = randomBytes(32).toString("base64url");
  const doc = await store.load();
  pruneExpired(doc);
  const challenge: PatientChallenge = {
    id: generateId("CHL", 4),
    kind: "magic-link",
    phone: normalizePatientPhone(phone),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + magicLinkTtlMs).toISOString(),
    secretHash: hashSecret(token),
    attempts: 0
  };
  doc.challenges = [challenge, ...doc.challenges].slice(0, 500);
  await store.save(doc);
  return { challenge, token };
}

export type ChallengeVerification =
  | { ok: true; phone: string }
  | { ok: false; error: string };

export async function verifyOtpChallenge(phone: string, code: string): Promise<ChallengeVerification> {
  const doc = await store.load();
  const normalized = normalizePatientPhone(phone);
  const now = Date.now();
  const challenge = doc.challenges.find(
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
    await store.save(doc);
    return { ok: false, error: "Too many wrong attempts. Request a new code." };
  }

  if (hashSecret(code.replace(/\D/g, "")) !== challenge.secretHash) {
    await store.save(doc);
    return { ok: false, error: "That code did not match. Check the SMS and try again." };
  }

  challenge.consumedAt = new Date().toISOString();
  await store.save(doc);
  return { ok: true, phone: challenge.phone };
}

export async function verifyMagicLinkChallenge(token: string): Promise<ChallengeVerification> {
  const doc = await store.load();
  const now = Date.now();
  const secretHash = hashSecret(token);
  const challenge = doc.challenges.find(
    (item) => item.kind === "magic-link" && item.secretHash === secretHash && !item.consumedAt
  );
  if (!challenge) return { ok: false, error: "This sign-in link is invalid or was already used." };
  if (new Date(challenge.expiresAt).getTime() <= now) {
    return { ok: false, error: "This sign-in link has expired. Request a new one." };
  }
  challenge.consumedAt = new Date().toISOString();
  await store.save(doc);
  return { ok: true, phone: challenge.phone };
}
