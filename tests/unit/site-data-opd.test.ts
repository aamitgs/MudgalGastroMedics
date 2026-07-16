import { describe, expect, it } from "vitest";
import { isOpdOpenNow, opdWindows } from "@/lib/site-data";

describe("opdWindows", () => {
  it("has the documented morning and evening windows", () => {
    expect(opdWindows).toEqual([
      { startLabel: "11 AM", endLabel: "2 PM", startMinutes: 11 * 60, endMinutes: 14 * 60 },
      { startLabel: "5 PM", endLabel: "6 PM", startMinutes: 17 * 60, endMinutes: 18 * 60 }
    ]);
  });
});

describe("isOpdOpenNow", () => {
  it("is closed just before the morning window opens", () => {
    expect(isOpdOpenNow("Mon", 10 * 60 + 59)).toBe(false);
  });

  it("is open at the morning window's opening minute", () => {
    expect(isOpdOpenNow("Mon", 11 * 60)).toBe(true);
  });

  it("is open in the middle of the morning window", () => {
    expect(isOpdOpenNow("Mon", 13 * 60 + 59)).toBe(true);
  });

  it("is closed exactly at the morning window's end minute (half-open interval)", () => {
    expect(isOpdOpenNow("Mon", 14 * 60)).toBe(false);
  });

  it("is closed in the gap between the morning and evening windows", () => {
    expect(isOpdOpenNow("Mon", 16 * 60)).toBe(false);
  });

  it("is open at the evening window's opening minute", () => {
    expect(isOpdOpenNow("Mon", 17 * 60)).toBe(true);
  });

  it("is closed exactly at the evening window's end minute (half-open interval)", () => {
    expect(isOpdOpenNow("Mon", 18 * 60)).toBe(false);
  });

  it("is closed on Sunday even during an otherwise-open window", () => {
    expect(isOpdOpenNow("Sun", 11 * 60)).toBe(false);
    expect(isOpdOpenNow("Sun", 17 * 60 + 30)).toBe(false);
  });

  it("is open on Saturday during the morning window", () => {
    expect(isOpdOpenNow("Sat", 11 * 60 + 30)).toBe(true);
  });
});
