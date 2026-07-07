import { describe, expect, it } from "vitest";
import type { AiCaseReview } from "@/lib/ai-types";
import { queryAiReviews } from "@/lib/ai-review-query";

function review(overrides: Partial<AiCaseReview> = {}): AiCaseReview {
  return {
    id: "AIR-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    source: "Appointment",
    sourceId: "APT-1",
    patientName: "Asha Verma",
    phone: "9876543210",
    service: "Gastro consult",
    urgency: "Routine",
    route: "General OPD",
    summary: "Routine consult, no red flags.",
    flags: [],
    preparation: [],
    receptionScript: "Please arrive 10 minutes early.",
    safetyNote: "AI planning support only.",
    status: "Draft",
    ...overrides
  };
}

const fixture: AiCaseReview[] = [
  review({ id: "R1", patientName: "Charlie", source: "Appointment", status: "Draft", createdAt: "2026-01-01T00:00:00.000Z" }),
  review({ id: "R2", patientName: "Alice", source: "OPD", status: "Needs Review", createdAt: "2026-01-02T00:00:00.000Z", urgency: "Priority Review" }),
  review({ id: "R3", patientName: "Bob", source: "OPD", status: "Escalated", createdAt: "2026-01-03T00:00:00.000Z", phone: "9123456789", urgency: "Urgent Reception Call" }),
  review({ id: "R4", patientName: "Dev", source: "Appointment", status: "Reviewed", createdAt: "2026-01-04T00:00:00.000Z" })
];

describe("queryAiReviews", () => {
  it("paginates: page size caps rows and reports total/pageCount", () => {
    const result = queryAiReviews(fixture, { page: 0, pageSize: 2, sortBy: "createdAt", sortDir: "asc" });
    expect(result.reviews).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.pageCount).toBe(2);
    expect(result.reviews.map((r) => r.id)).toEqual(["R1", "R2"]);
  });

  it("clamps an out-of-range page back to the last valid page", () => {
    const result = queryAiReviews(fixture, { page: 99, pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.reviews).toHaveLength(2);
  });

  it("sorts by patient name ascending and descending", () => {
    const asc = queryAiReviews(fixture, { page: 0, pageSize: 10, sortBy: "patientName", sortDir: "asc" });
    expect(asc.reviews.map((r) => r.patientName)).toEqual(["Alice", "Bob", "Charlie", "Dev"]);
    const desc = queryAiReviews(fixture, { page: 0, pageSize: 10, sortBy: "patientName", sortDir: "desc" });
    expect(desc.reviews.map((r) => r.patientName)).toEqual(["Dev", "Charlie", "Bob", "Alice"]);
  });

  it("filters by free-text query across patient, phone and service", () => {
    const byName = queryAiReviews(fixture, { page: 0, pageSize: 10, query: "alice" });
    expect(byName.reviews.map((r) => r.id)).toEqual(["R2"]);

    const byPhone = queryAiReviews(fixture, { page: 0, pageSize: 10, query: "9123456789" });
    expect(byPhone.reviews.map((r) => r.id)).toEqual(["R3"]);
  });

  it("filters by status", () => {
    const result = queryAiReviews(fixture, { page: 0, pageSize: 10, status: "Escalated" });
    expect(result.reviews.map((r) => r.id)).toEqual(["R3"]);
  });

  it("filters by source", () => {
    const result = queryAiReviews(fixture, { page: 0, pageSize: 10, source: "OPD" });
    expect(result.reviews.map((r) => r.id)).toEqual(["R3", "R2"]);
  });

  it("combines status and source filters", () => {
    const result = queryAiReviews(fixture, { page: 0, pageSize: 10, status: "Needs Review", source: "OPD" });
    expect(result.reviews.map((r) => r.id)).toEqual(["R2"]);
    expect(queryAiReviews(fixture, { page: 0, pageSize: 10, status: "Needs Review", source: "Appointment" }).reviews).toEqual([]);
  });

  it("defaults to newest-first by createdAt when no sort is given", () => {
    const result = queryAiReviews(fixture, { page: 0, pageSize: 10 });
    expect(result.reviews.map((r) => r.id)).toEqual(["R4", "R3", "R2", "R1"]);
  });

  it("returns an empty page gracefully when nothing matches", () => {
    const result = queryAiReviews(fixture, { page: 0, pageSize: 10, query: "zzz-no-match" });
    expect(result.reviews).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });

  it("caps pageSize at 100 and floors it at 1", () => {
    expect(queryAiReviews(fixture, { page: 0, pageSize: 0 }).reviews.length).toBeLessThanOrEqual(1);
    expect(queryAiReviews(fixture, { page: 0, pageSize: 500 }).total).toBe(4);
  });
});
