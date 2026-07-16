import { describe, expect, it } from "vitest";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone";

describe("normalizePhoneNumber", () => {
  it("formats a plain 10-digit India mobile number", () => {
    expect(normalizePhoneNumber("9828912257")).toBe("+91 9828912257");
  });

  it("strips a leading 0 on an 11-digit India number", () => {
    expect(normalizePhoneNumber("09828912257")).toBe("+91 9828912257");
  });

  it("preserves an already-international number as-is", () => {
    expect(normalizePhoneNumber("+1 4155552671", "+1")).toBe("+14155552671");
  });

  it("falls back to '<country code> <digits>' for non-India numbers without a plus", () => {
    expect(normalizePhoneNumber("4155552671", "+1")).toBe("+1 4155552671");
  });

  it("returns an empty string when there are no digits", () => {
    expect(normalizePhoneNumber("")).toBe("");
    expect(normalizePhoneNumber(null)).toBe("");
    expect(normalizePhoneNumber(undefined)).toBe("");
  });
});

describe("isValidPhoneNumber", () => {
  it("accepts numbers within the 7-15 digit range", () => {
    expect(isValidPhoneNumber("+91 9828912257")).toBe(true);
    expect(isValidPhoneNumber("1234567")).toBe(true);
    expect(isValidPhoneNumber("123456789012345")).toBe(true);
  });

  it("rejects numbers outside the 7-15 digit range", () => {
    expect(isValidPhoneNumber("123456")).toBe(false);
    expect(isValidPhoneNumber("1234567890123456")).toBe(false);
    expect(isValidPhoneNumber("")).toBe(false);
  });
});
