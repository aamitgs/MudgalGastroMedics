import "server-only";
import { timingSafeEqual } from "node:crypto";

export const doctorSessionCookie = "mgm_doctor_session";
const sessionValue = "authenticated";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getDoctorPasscode() {
  return process.env.DOCTOR_PASSCODE || (isProduction() ? "" : "mgm-doctor");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isValidDoctorPasscode(passcode: string) {
  const expected = getDoctorPasscode();
  return Boolean(expected) && safeCompare(passcode, expected);
}

export function isDoctorSessionValue(value: string | undefined) {
  return value === sessionValue;
}

export function createDoctorSessionCookie() {
  return {
    name: doctorSessionCookie,
    value: sessionValue,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  };
}

export function clearDoctorSessionCookie() {
  return {
    name: doctorSessionCookie,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  };
}

export function hasDoctorCookie(cookieHeader: string | null) {
  if (!cookieHeader) return false;
  return cookieHeader.split(";").some((cookie) => {
    const [name, value] = cookie.trim().split("=");
    return name === doctorSessionCookie && isDoctorSessionValue(value);
  });
}
