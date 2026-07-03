import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export const adminSessionCookie = "mgm_admin_session";
export const adminStaffCookie = "mgm_admin_staff";
const sessionValue = "authenticated";
const sessionTtlSeconds = 60 * 60 * 8;

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getAdminPasscode() {
  return process.env.ADMIN_PASSCODE || (isProduction() ? "" : "mgm-admin");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getAuthSecret() {
  return process.env.ADMIN_AUTH_SECRET || process.env.ADMIN_PASSCODE || (isProduction() ? "" : "mgm-local-auth-secret");
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  const secret = getAuthSecret();
  if (!secret) throw new Error("ADMIN_AUTH_SECRET is required for signed admin sessions in production.");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function createSignedSessionValue(staffId: string) {
  const payload = encodeBase64Url(JSON.stringify({
    staffId,
    exp: Math.floor(Date.now() / 1000) + sessionTtlSeconds
  }));
  return `${payload}.${signPayload(payload)}`;
}

function parseSignedSessionValue(value: string | undefined) {
  if (!value || !value.includes(".")) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  try {
    if (!safeCompare(signature, signPayload(payload))) return null;
  } catch {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as { staffId?: string; exp?: number };
    if (!parsed.staffId || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isValidAdminPasscode(passcode: string) {
  const expected = getAdminPasscode();
  return Boolean(expected) && safeCompare(passcode, expected);
}

export function isAdminSessionValue(value: string | undefined) {
  return value === sessionValue || Boolean(parseSignedSessionValue(value));
}

export function createAdminSessionCookie(staffId = "STF-ADMIN-001") {
  return {
    name: adminSessionCookie,
    value: createSignedSessionValue(staffId),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionTtlSeconds
  };
}

export function createAdminStaffCookie(staffId = "STF-ADMIN-001") {
  return {
    name: adminStaffCookie,
    value: staffId,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionTtlSeconds
  };
}

export function clearAdminSessionCookie() {
  return {
    name: adminSessionCookie,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  };
}

export function clearAdminStaffCookie() {
  return {
    name: adminStaffCookie,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  };
}

export function getAdminStaffIdFromCookie(cookieHeader: string | null) {
  if (!cookieHeader) return "";
  const sessionCookie = cookieHeader.split(";").find((cookie) => cookie.trim().startsWith(`${adminSessionCookie}=`));
  const signedSession = parseSignedSessionValue(sessionCookie?.trim().split("=")[1]);
  if (signedSession?.staffId) return signedSession.staffId;
  const staffCookie = cookieHeader.split(";").find((cookie) => cookie.trim().startsWith(`${adminStaffCookie}=`));
  return staffCookie?.trim().split("=")[1] || "";
}

export function hasAdminCookie(cookieHeader: string | null) {
  if (!cookieHeader) return false;
  return cookieHeader.split(";").some((cookie) => {
    const [name, value] = cookie.trim().split("=");
    return name === adminSessionCookie && isAdminSessionValue(value);
  });
}
