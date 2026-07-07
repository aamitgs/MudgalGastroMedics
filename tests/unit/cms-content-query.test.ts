import { describe, expect, it } from "vitest";
import type { CmsContentItem } from "@/lib/cms-types";
import { queryCmsContent } from "@/lib/cms-content-query";

function item(overrides: Partial<CmsContentItem> = {}): CmsContentItem {
  return {
    id: "CMS-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    type: "Page",
    status: "Draft",
    title: "About Us",
    slug: "/about",
    summary: "Hospital overview page",
    owner: "Admin",
    ...overrides
  };
}

const fixture: CmsContentItem[] = [
  item({ id: "I1", title: "Charlie Page", type: "Page", status: "Draft", createdAt: "2026-01-01T00:00:00.000Z" }),
  item({ id: "I2", title: "Alice Procedure", type: "Procedure", status: "Published", createdAt: "2026-01-02T00:00:00.000Z", owner: "Reception" }),
  item({ id: "I3", title: "Bob Gallery", type: "Gallery", status: "In Review", createdAt: "2026-01-03T00:00:00.000Z", slug: "/gallery#bob" }),
  item({ id: "I4", title: "Dev Announcement", type: "Announcement", status: "Archived", createdAt: "2026-01-04T00:00:00.000Z" })
];

describe("queryCmsContent", () => {
  it("paginates: page size caps rows and reports total/pageCount", () => {
    const result = queryCmsContent(fixture, { page: 0, pageSize: 2, sortBy: "createdAt", sortDir: "asc" });
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.pageCount).toBe(2);
    expect(result.items.map((i) => i.id)).toEqual(["I1", "I2"]);
  });

  it("clamps an out-of-range page back to the last valid page", () => {
    const result = queryCmsContent(fixture, { page: 99, pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.items).toHaveLength(2);
  });

  it("sorts by title ascending and descending", () => {
    const asc = queryCmsContent(fixture, { page: 0, pageSize: 10, sortBy: "title", sortDir: "asc" });
    expect(asc.items.map((i) => i.title)).toEqual(["Alice Procedure", "Bob Gallery", "Charlie Page", "Dev Announcement"]);
    const desc = queryCmsContent(fixture, { page: 0, pageSize: 10, sortBy: "title", sortDir: "desc" });
    expect(desc.items.map((i) => i.title)).toEqual(["Dev Announcement", "Charlie Page", "Bob Gallery", "Alice Procedure"]);
  });

  it("filters by free-text query across title, slug, summary and owner", () => {
    const byTitle = queryCmsContent(fixture, { page: 0, pageSize: 10, query: "alice" });
    expect(byTitle.items.map((i) => i.id)).toEqual(["I2"]);

    const bySlug = queryCmsContent(fixture, { page: 0, pageSize: 10, query: "gallery#bob" });
    expect(bySlug.items.map((i) => i.id)).toEqual(["I3"]);

    const byOwner = queryCmsContent(fixture, { page: 0, pageSize: 10, query: "reception" });
    expect(byOwner.items.map((i) => i.id)).toEqual(["I2"]);
  });

  it("filters by status", () => {
    const result = queryCmsContent(fixture, { page: 0, pageSize: 10, status: "Archived" });
    expect(result.items.map((i) => i.id)).toEqual(["I4"]);
  });

  it("filters by type", () => {
    const result = queryCmsContent(fixture, { page: 0, pageSize: 10, type: "Gallery" });
    expect(result.items.map((i) => i.id)).toEqual(["I3"]);
  });

  it("combines status and type filters", () => {
    const result = queryCmsContent(fixture, { page: 0, pageSize: 10, status: "Published", type: "Procedure" });
    expect(result.items.map((i) => i.id)).toEqual(["I2"]);
    expect(queryCmsContent(fixture, { page: 0, pageSize: 10, status: "Published", type: "Gallery" }).items).toEqual([]);
  });

  it("defaults to newest-first by createdAt when no sort is given", () => {
    const result = queryCmsContent(fixture, { page: 0, pageSize: 10 });
    expect(result.items.map((i) => i.id)).toEqual(["I4", "I3", "I2", "I1"]);
  });

  it("returns an empty page gracefully when nothing matches", () => {
    const result = queryCmsContent(fixture, { page: 0, pageSize: 10, query: "zzz-no-match" });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });

  it("caps pageSize at 100 and floors it at 1", () => {
    expect(queryCmsContent(fixture, { page: 0, pageSize: 0 }).items.length).toBeLessThanOrEqual(1);
    expect(queryCmsContent(fixture, { page: 0, pageSize: 500 }).total).toBe(4);
  });
});
