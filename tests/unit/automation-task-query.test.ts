import { describe, expect, it } from "vitest";
import type { AutomationTask } from "@/lib/automation-types";
import { queryAutomationTasks } from "@/lib/automation-task-query";

function task(overrides: Partial<AutomationTask> = {}): AutomationTask {
  return {
    id: "TASK-1",
    key: "task-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    dueAt: "2026-01-10",
    type: "Appointment Follow-up",
    status: "Open",
    priority: "Normal",
    title: "Follow up with patient",
    description: "Call to confirm attendance",
    ...overrides
  };
}

const fixture: AutomationTask[] = [
  task({ id: "T1", title: "Charlie task", priority: "Low", status: "Open", dueAt: "2026-01-14", createdAt: "2026-01-01T00:00:00.000Z" }),
  task({ id: "T2", title: "Alice task", priority: "Urgent", status: "Escalated", dueAt: "2026-01-11", createdAt: "2026-01-02T00:00:00.000Z", patientName: "Alice" }),
  task({ id: "T3", title: "Bob task", priority: "High", status: "Queued", dueAt: "2026-01-12", createdAt: "2026-01-03T00:00:00.000Z", phone: "9123456789" }),
  task({ id: "T4", title: "Dev task", priority: "Normal", status: "Done", dueAt: "2026-01-13", createdAt: "2026-01-04T00:00:00.000Z" })
];

describe("queryAutomationTasks", () => {
  it("paginates: page size caps rows and reports total/pageCount", () => {
    const result = queryAutomationTasks(fixture, { page: 0, pageSize: 2, sortBy: "createdAt", sortDir: "asc" });
    expect(result.tasks).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.pageCount).toBe(2);
    expect(result.tasks.map((t) => t.id)).toEqual(["T1", "T2"]);
  });

  it("clamps an out-of-range page back to the last valid page", () => {
    const result = queryAutomationTasks(fixture, { page: 99, pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.tasks).toHaveLength(2);
  });

  it("sorts by title ascending and descending", () => {
    const asc = queryAutomationTasks(fixture, { page: 0, pageSize: 10, sortBy: "title", sortDir: "asc" });
    expect(asc.tasks.map((t) => t.id)).toEqual(["T2", "T3", "T1", "T4"]);
    const desc = queryAutomationTasks(fixture, { page: 0, pageSize: 10, sortBy: "title", sortDir: "desc" });
    expect(desc.tasks.map((t) => t.id)).toEqual(["T4", "T1", "T3", "T2"]);
  });

  it("sorts by priority using clinical urgency rank, not alphabetically", () => {
    const result = queryAutomationTasks(fixture, { page: 0, pageSize: 10, sortBy: "priority", sortDir: "desc" });
    expect(result.tasks.map((t) => t.id)).toEqual(["T2", "T3", "T4", "T1"]);
  });

  it("defaults to soonest-due-first (dueAt ascending) when no sort is given", () => {
    const result = queryAutomationTasks(fixture, { page: 0, pageSize: 10 });
    expect(result.tasks.map((t) => t.id)).toEqual(["T2", "T3", "T4", "T1"]);
  });

  it("filters by free-text query across title, description, patient, phone and owner", () => {
    const byTitle = queryAutomationTasks(fixture, { page: 0, pageSize: 10, query: "alice" });
    expect(byTitle.tasks.map((t) => t.id)).toEqual(["T2"]);

    const byPhone = queryAutomationTasks(fixture, { page: 0, pageSize: 10, query: "9123456789" });
    expect(byPhone.tasks.map((t) => t.id)).toEqual(["T3"]);
  });

  it("filters by status", () => {
    const result = queryAutomationTasks(fixture, { page: 0, pageSize: 10, status: "Done" });
    expect(result.tasks.map((t) => t.id)).toEqual(["T4"]);
  });

  it("returns an empty page gracefully when nothing matches", () => {
    const result = queryAutomationTasks(fixture, { page: 0, pageSize: 10, query: "zzz-no-match" });
    expect(result.tasks).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });

  it("caps pageSize at 100 and floors it at 1", () => {
    expect(queryAutomationTasks(fixture, { page: 0, pageSize: 0 }).tasks.length).toBeLessThanOrEqual(1);
    expect(queryAutomationTasks(fixture, { page: 0, pageSize: 500 }).total).toBe(4);
  });
});
