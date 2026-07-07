import { describe, expect, it } from "vitest";
import type { CommunicationLog } from "@/lib/communication-types";
import { queryCommunicationLogs } from "@/lib/communication-log-query";

function log(overrides: Partial<CommunicationLog> = {}): CommunicationLog {
  return {
    id: "COMM-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    patientName: "Asha Verma",
    phone: "9876543210",
    channel: "WhatsApp",
    template: "Appointment Confirmation",
    status: "Draft",
    subject: "Appointment confirmation",
    message: "Dear patient, your appointment is confirmed.",
    ...overrides
  };
}

const fixture: CommunicationLog[] = [
  log({ id: "C1", patientName: "Charlie", channel: "WhatsApp", status: "Draft", createdAt: "2026-01-01T00:00:00.000Z" }),
  log({ id: "C2", patientName: "Alice", channel: "SMS", status: "Sent", createdAt: "2026-01-02T00:00:00.000Z", phone: "9123456789" }),
  log({ id: "C3", patientName: "Bob", channel: "Call", status: "Follow-up Needed", createdAt: "2026-01-03T00:00:00.000Z", subject: "Payment reminder" }),
  log({ id: "C4", patientName: "Dev", channel: "Email", status: "Failed", createdAt: "2026-01-04T00:00:00.000Z" })
];

describe("queryCommunicationLogs", () => {
  it("paginates: page size caps rows and reports total/pageCount", () => {
    const result = queryCommunicationLogs(fixture, { page: 0, pageSize: 2, sortBy: "createdAt", sortDir: "asc" });
    expect(result.logs).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.pageCount).toBe(2);
    expect(result.logs.map((l) => l.id)).toEqual(["C1", "C2"]);
  });

  it("clamps an out-of-range page back to the last valid page", () => {
    const result = queryCommunicationLogs(fixture, { page: 99, pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.logs).toHaveLength(2);
  });

  it("sorts by patient name ascending and descending", () => {
    const asc = queryCommunicationLogs(fixture, { page: 0, pageSize: 10, sortBy: "patientName", sortDir: "asc" });
    expect(asc.logs.map((l) => l.patientName)).toEqual(["Alice", "Bob", "Charlie", "Dev"]);
    const desc = queryCommunicationLogs(fixture, { page: 0, pageSize: 10, sortBy: "patientName", sortDir: "desc" });
    expect(desc.logs.map((l) => l.patientName)).toEqual(["Dev", "Charlie", "Bob", "Alice"]);
  });

  it("filters by free-text query across patient, phone and subject", () => {
    const byName = queryCommunicationLogs(fixture, { page: 0, pageSize: 10, query: "alice" });
    expect(byName.logs.map((l) => l.id)).toEqual(["C2"]);

    const byPhone = queryCommunicationLogs(fixture, { page: 0, pageSize: 10, query: "9123456789" });
    expect(byPhone.logs.map((l) => l.id)).toEqual(["C2"]);

    const bySubject = queryCommunicationLogs(fixture, { page: 0, pageSize: 10, query: "payment reminder" });
    expect(bySubject.logs.map((l) => l.id)).toEqual(["C3"]);
  });

  it("filters by status", () => {
    const result = queryCommunicationLogs(fixture, { page: 0, pageSize: 10, status: "Failed" });
    expect(result.logs.map((l) => l.id)).toEqual(["C4"]);
  });

  it("filters by channel", () => {
    const result = queryCommunicationLogs(fixture, { page: 0, pageSize: 10, channel: "SMS" });
    expect(result.logs.map((l) => l.id)).toEqual(["C2"]);
  });

  it("combines status and channel filters", () => {
    const result = queryCommunicationLogs(fixture, { page: 0, pageSize: 10, status: "Sent", channel: "SMS" });
    expect(result.logs.map((l) => l.id)).toEqual(["C2"]);
    expect(queryCommunicationLogs(fixture, { page: 0, pageSize: 10, status: "Sent", channel: "Call" }).logs).toEqual([]);
  });

  it("defaults to newest-first by createdAt when no sort is given", () => {
    const result = queryCommunicationLogs(fixture, { page: 0, pageSize: 10 });
    expect(result.logs.map((l) => l.id)).toEqual(["C4", "C3", "C2", "C1"]);
  });

  it("returns an empty page gracefully when nothing matches", () => {
    const result = queryCommunicationLogs(fixture, { page: 0, pageSize: 10, query: "zzz-no-match" });
    expect(result.logs).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });

  it("caps pageSize at 100 and floors it at 1", () => {
    expect(queryCommunicationLogs(fixture, { page: 0, pageSize: 0 }).logs.length).toBeLessThanOrEqual(1);
    expect(queryCommunicationLogs(fixture, { page: 0, pageSize: 500 }).total).toBe(4);
  });
});
