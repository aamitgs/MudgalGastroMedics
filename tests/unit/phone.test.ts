import { describe, expect, it } from "vitest";
import { isValidPhoneNumber, normalizePhoneNumber, patientIdentityKey } from "@/lib/phone";

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

/**
 * The audit trail keys every clinical-record access on this value, so two
 * formats of the same number must collapse to one id. If they did not, the
 * access log could not answer "who opened this patient's record" — which is
 * the only question it exists to answer.
 */
describe("patientIdentityKey", () => {
  it("collapses every stored format of one number to a single key", () => {
    for (const input of ["9876543210", "+91 9876543210", "+91-98765-43210", "091 98765 43210", "(+91) 98765 43210"]) {
      expect(patientIdentityKey(input), `should key ${input} the same`).toBe("9876543210");
    }
  });

  it("drops a country code rather than splitting one patient into two ids", () => {
    expect(patientIdentityKey("00919876543210")).toBe("9876543210");
  });

  it("returns empty for nothing identifiable, so callers can skip the write", () => {
    expect(patientIdentityKey("")).toBe("");
    expect(patientIdentityKey(null)).toBe("");
    expect(patientIdentityKey(undefined)).toBe("");
    expect(patientIdentityKey("not a phone")).toBe("");
  });

  it("never pads a short number up to ten digits", () => {
    expect(patientIdentityKey("12345")).toBe("12345");
  });
});
