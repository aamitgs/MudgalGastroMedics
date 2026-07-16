import { describe, expect, it } from "vitest";
import { findWaitlistMatch } from "@/lib/appointment-waitlist-match";
import type { AppointmentRecord } from "@/lib/appointment-types";
import type { AppointmentWaitlistEntry } from "@/lib/appointment-waitlist-types";

function appointment(overrides: Partial<AppointmentRecord> = {}): AppointmentRecord {
  return {
    id: "MGM-1",
    createdAt: "2026-07-01T10:00:00.000Z",
    status: "Cancelled",
    name: "Cancelling Patient",
    phone: "9990001111",
    service: "Endoscopy",
    date: "2026-07-10",
    symptoms: [],
    ...overrides
  };
}

function entry(overrides: Partial<AppointmentWaitlistEntry> = {}): AppointmentWaitlistEntry {
  return {
    id: "WL-1",
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
    name: "Waitlisted Patient",
    phone: "9990002222",
    service: "Endoscopy",
    status: "Waiting",
    ...overrides
  };
}

describe("findWaitlistMatch", () => {
  it("returns undefined when the cancelled appointment has no scheduled date", () => {
    expect(findWaitlistMatch([entry()], appointment({ date: undefined }))).toBeUndefined();
  });

  it("matches on the same service and exact preferred date", () => {
    const match = entry({ id: "W-match", preferredDate: "2026-07-10" });
    const result = findWaitlistMatch([match], appointment());
    expect(result?.id).toBe("W-match");
  });

  it("matches an entry with no preferred date (any date works)", () => {
    const match = entry({ id: "W-any", preferredDate: undefined });
    const result = findWaitlistMatch([match], appointment());
    expect(result?.id).toBe("W-any");
  });

  it("does not match a different preferred date", () => {
    const result = findWaitlistMatch([entry({ preferredDate: "2026-08-01" })], appointment());
    expect(result).toBeUndefined();
  });

  it("does not match a different service, case-insensitivity aside", () => {
    const wrongService = findWaitlistMatch([entry({ service: "Colonoscopy" })], appointment());
    expect(wrongService).toBeUndefined();

    const sameServiceDifferentCase = findWaitlistMatch([entry({ service: "  endoscopy  " })], appointment());
    expect(sameServiceDifferentCase).toBeDefined();
  });

  it("ignores entries not in Waiting status", () => {
    const offered = findWaitlistMatch([entry({ status: "Offered" })], appointment());
    expect(offered).toBeUndefined();
    const booked = findWaitlistMatch([entry({ status: "Booked" })], appointment());
    expect(booked).toBeUndefined();
  });

  it("picks the oldest matching entry (FIFO), not the first in array order", () => {
    const newer = entry({ id: "W-newer", createdAt: "2026-06-15T10:00:00.000Z" });
    const older = entry({ id: "W-older", createdAt: "2026-06-01T10:00:00.000Z" });
    const result = findWaitlistMatch([newer, older], appointment());
    expect(result?.id).toBe("W-older");
  });

  it("returns undefined when no entries match at all", () => {
    expect(findWaitlistMatch([], appointment())).toBeUndefined();
  });
});
