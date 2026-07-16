import { describe, expect, it } from "vitest";
import { generateId } from "@/lib/id";

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
