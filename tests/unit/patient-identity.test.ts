import { describe, expect, it } from "vitest";
import { isSamePatient, patientKey } from "@/lib/patient-identity";

describe("patientKey", () => {
  it("reduces however the number was typed to the same storage key", () => {
    expect(patientKey("+91 98765 43210")).toBe("919876543210");
    expect(patientKey("9876543210")).toBe("9876543210");
    expect(patientKey("098-765-43210")).toBe("09876543210");
  });

  it("survives a missing value rather than throwing on it", () => {
    expect(patientKey(undefined)).toBe("");
    expect(patientKey(null)).toBe("");
  });
});

describe("isSamePatient", () => {
  it("matches the same number written with and without a country code", () => {
    expect(isSamePatient("+919876543210", "9876543210")).toBe(true);
    expect(isSamePatient("9876543210", "+91 98765 43210")).toBe(true);
    expect(isSamePatient("9876543210", "9876543210")).toBe(true);
  });

  // The rule that carries the security weight: this predicate is what stops an
  // insurance claim settling against another patient's bill.
  it("does not match two different patients", () => {
    expect(isSamePatient("9876543210", "9123456780")).toBe(false);
    expect(isSamePatient("+919876543210", "+919123456780")).toBe(false);
  });

  it("does not match on a shared trailing fragment that is too short to mean anything", () => {
    expect(isSamePatient("43210", "9876543210")).toBe(false);
    expect(isSamePatient("", "9876543210")).toBe(false);
    expect(isSamePatient(undefined, undefined)).toBe(false);
  });

  // Two numbers differing only in their last digit share no suffix, so the
  // tolerance cannot widen into "close enough".
  it("treats a one-digit difference as a different patient", () => {
    expect(isSamePatient("9876543210", "9876543211")).toBe(false);
  });
});
