import { describe, expect, it } from "vitest";
import { generateId, nextSerialNumber } from "@/lib/id";

describe("generateId", () => {
  it("matches PREFIX-<base36 timestamp>-<base36 random> in upper case", () => {
    expect(generateId("PAT")).toMatch(/^PAT-[0-9A-Z]+-[0-9A-Z]{1,3}$/);
  });

  it("defaults the random suffix to 3 characters", () => {
    const id = generateId("PAT");
    const random = id.split("-")[2];
    expect(random.length).toBeLessThanOrEqual(3);
  });

  it("honors a custom random suffix length", () => {
    const id = generateId("USR", 4);
    const random = id.split("-")[2];
    expect(random.length).toBeLessThanOrEqual(4);
  });

  it("produces unique ids across repeated calls given enough random suffix length", () => {
    // The default 3-char suffix collides at volume via the birthday paradox
    // (a real, pre-existing characteristic of the original hand-copied pattern,
    // not a regression) — use a longer suffix here to test actual uniqueness.
    const ids = new Set(Array.from({ length: 500 }, () => generateId("PAT", 7)));
    expect(ids.size).toBe(500);
  });
});

describe("nextSerialNumber", () => {
  const in2026 = new Date("2026-08-11T10:00:00.000Z");

  it("starts a fresh series at 00001", () => {
    expect(nextSerialNumber("IPD", [], in2026)).toBe("IPD-2026-00001");
  });

  it("continues from the highest number already issued", () => {
    expect(nextSerialNumber("IPD", ["IPD-2026-00001", "IPD-2026-00007", "IPD-2026-00003"], in2026)).toBe("IPD-2026-00008");
  });

  // A count of live records would reissue a deleted registration's number to
  // the next person to walk in. Callers keep retired numbers in what they pass
  // (patient-store.ts holds them in retiredUhids) precisely so this holds even
  // when the deleted record was the most recent one.
  it("does not reissue a retired number, including the highest", () => {
    const live = ["MGM-2026-00001", "MGM-2026-00002"];
    const retired = ["MGM-2026-00003"];
    expect(nextSerialNumber("MGM", [...live, ...retired], in2026)).toBe("MGM-2026-00004");
  });

  it("restarts each calendar year without colliding with the year before", () => {
    const issued = ["IPD-2025-00042"];
    expect(nextSerialNumber("IPD", issued, in2026)).toBe("IPD-2026-00001");
    expect(nextSerialNumber("IPD", issued, new Date("2025-06-15T12:00:00.000Z"))).toBe("IPD-2025-00043");
  });

  it("ignores other years, other prefixes and absent values", () => {
    const issued = ["IPD-2025-99999", "MGM-2026-00500", undefined, null, ""];
    expect(nextSerialNumber("IPD", issued, in2026)).toBe("IPD-2026-00001");
  });

  it("ignores malformed suffixes rather than coercing them into the series", () => {
    // Number("1e9") is 1000000000 — one junk value would otherwise skip the
    // series past every number a human would ever read out.
    expect(nextSerialNumber("IPD", ["IPD-2026-1e9", "IPD-2026- 12", "IPD-2026-abc", "IPD-2026-00004"], in2026)).toBe("IPD-2026-00005");
  });

  it("keeps the shape already issued to existing UHIDs", () => {
    expect(nextSerialNumber("MGM", ["MGM-2026-00001"], in2026)).toMatch(/^MGM-\d{4}-\d{5}$/);
  });

  it("widens past five digits rather than wrapping", () => {
    expect(nextSerialNumber("IPD", ["IPD-2026-99999"], in2026)).toBe("IPD-2026-100000");
  });
});
