import "server-only";

import { timingSafeEqual } from "node:crypto";
import { getStaffById } from "@/lib/hr-store";
import type { StaffMember } from "@/lib/hr-types";

type StaffCredential = {
  username: string;
  password: string;
  staffId: string;
};

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function parseStaffCredentials(): StaffCredential[] {
  const raw = process.env.STAFF_USERS_JSON;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as StaffCredential[];
      if (Array.isArray(parsed)) {
        return parsed.filter((entry) => entry.username && entry.password && entry.staffId);
      }
    } catch {
      return [];
    }
  }

  if (isProduction()) {
    const adminPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSCODE;
    const receptionPassword = process.env.RECEPTION_PASSWORD;
    return [
      adminPassword
        ? {
            username: process.env.ADMIN_USERNAME || "admin",
            password: adminPassword,
            staffId: "STF-ADMIN-001"
          }
        : null,
      receptionPassword
        ? {
            username: process.env.RECEPTION_USERNAME || "reception",
            password: receptionPassword,
            staffId: "STF-RECEPTION-001"
          }
        : null
    ].filter((entry): entry is StaffCredential => Boolean(entry));
  }

  return [
    {
      username: process.env.ADMIN_USERNAME || "admin",
      password: process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSCODE || "mgm-admin",
      staffId: "STF-ADMIN-001"
    },
    {
      username: process.env.RECEPTION_USERNAME || "reception",
      password: process.env.RECEPTION_PASSWORD || "mgm-reception",
      staffId: "STF-RECEPTION-001"
    }
  ];
}

export function authenticateStaffUser(username: string, password: string): StaffMember | null {
  const normalizedUsername = username.trim().toLowerCase();
  const credential = parseStaffCredentials().find((entry) => entry.username.trim().toLowerCase() === normalizedUsername);
  if (!credential || !safeCompare(password, credential.password)) return null;
  const staff = getStaffById(credential.staffId);
  if (!staff || staff.status !== "Active") return null;
  return staff;
}
