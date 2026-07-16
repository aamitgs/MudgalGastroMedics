import { describe, expect, it } from "vitest";
import { evaluateRecall, evaluateRecalls, recallDueSoonWindowDays } from "@/lib/clinical/recall";
import type { OpdVisit } from "@/lib/opd-types";

const now = new Date("2026-07-15T12:00:00");

function daysFromNow(days: number) {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function visit(overrides: Partial<OpdVisit> = {}): OpdVisit {
  return {
    id: "OPD-1",
    token: "T-1",
    appointmentId: "APT-1",
    patientId: "PAT-1",
    createdAt: now.toISOString(),
    status: "Completed",
    patientName: "Ravi Kumar",
    phone: "9876500000",
    service: "GI consult",
    symptoms: [],
    billingStatus: "Paid",
    ...overrides
  };
}

describe("evaluateRecall", () => {
  it("returns null when no follow-up date is set", () => {
    expect(evaluateRecall(visit({ followUpDate: undefined }), [], now)).toBeNull();
  });

  it("returns null for an unparsable follow-up date", () => {
    expect(evaluateRecall(visit({ followUpDate: "not-a-date" }), [], now)).toBeNull();
  });

  it("is not-due when the date is well in the future", () => {
    const result = evaluateRecall(visit({ followUpDate: daysFromNow(30) }), [], now);
    expect(result?.status).toBe("not-due");
  });

  it("is due-soon within the lookahead window", () => {
    const result = evaluateRecall(visit({ followUpDate: daysFromNow(recallDueSoonWindowDays - 1) }), [], now);
    expect(result?.status).toBe("due-soon");
  });

  it("is overdue once the date has passed with no later visit", () => {
    const result = evaluateRecall(visit({ id: "OPD-1", followUpDate: daysFromNow(-10) }), [visit({ id: "OPD-1", followUpDate: daysFromNow(-10) })], now);
    expect(result?.status).toBe("overdue");
    expect(result?.daysOverdue).toBe(10);
  });

  it("is fulfilled once the same patient has a later visit on or after the due date", () => {
    const original = visit({ id: "OPD-1", patientId: "PAT-1", followUpDate: daysFromNow(-10) });
    const returnVisit = visit({ id: "OPD-2", patientId: "PAT-1", createdAt: daysFromNow(-2) });
    const result = evaluateRecall(original, [original, returnVisit], now);
    expect(result?.status).toBe("fulfilled");
  });

  it("does not count an earlier visit before the due date as fulfillment", () => {
    const original = visit({ id: "OPD-1", patientId: "PAT-1", followUpDate: daysFromNow(-5) });
    const earlierVisit = visit({ id: "OPD-2", patientId: "PAT-1", createdAt: daysFromNow(-20) });
    const result = evaluateRecall(original, [original, earlierVisit], now);
    expect(result?.status).toBe("overdue");
  });

  it("never auto-fulfills a visit with no patientId, even if another visit matches by coincidence", () => {
    const original = visit({ id: "OPD-1", patientId: undefined, followUpDate: daysFromNow(-10) });
    const otherVisit = visit({ id: "OPD-2", patientId: undefined, createdAt: daysFromNow(-1) });
    const result = evaluateRecall(original, [original, otherVisit], now);
    expect(result?.status).toBe("overdue");
  });
});

describe("evaluateRecalls", () => {
  it("evaluates every visit carrying a follow-up date and skips those without one", () => {
    const withDate = visit({ id: "OPD-1", followUpDate: daysFromNow(-3) });
    const withoutDate = visit({ id: "OPD-2", patientId: "PAT-2", followUpDate: undefined });
    const results = evaluateRecalls([withDate, withoutDate], now);
    expect(results.size).toBe(1);
    expect(results.get("OPD-1")?.status).toBe("overdue");
    expect(results.has("OPD-2")).toBe(false);
  });

  it("resolves fulfillment correctly across a full patient visit history", () => {
    const first = visit({ id: "OPD-1", patientId: "PAT-9", followUpDate: daysFromNow(-15) });
    const second = visit({ id: "OPD-2", patientId: "PAT-9", createdAt: daysFromNow(-1), followUpDate: daysFromNow(60) });
    const results = evaluateRecalls([first, second], now);
    expect(results.get("OPD-1")?.status).toBe("fulfilled");
    expect(results.get("OPD-2")?.status).toBe("not-due");
  });
});
