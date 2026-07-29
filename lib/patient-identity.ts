/**
 * How this system decides two records describe the same patient.
 *
 * The document stores identify patients by phone number, which arrives in
 * whatever shape the person at the counter typed it: "+91 98765 43210",
 * "09876543210", "9876543210". Two rules follow, and they are deliberately
 * different from each other:
 *
 * - `patientKey` is a **storage key**. Exact digits, nothing clever. Changing
 *   what it returns would orphan every record already filed under the old key,
 *   so it must stay byte-stable.
 * - `isSamePatient` is a **comparison**, used when two records that were
 *   captured separately have to be recognised as one person. It tolerates a
 *   missing or extra country code, because a claim filed as "+919876543210"
 *   and an invoice raised as "9876543210" are the same patient and refusing
 *   that pairing would block legitimate work.
 *
 * The suffix tolerance mirrors the lookups in `finance-store`, `opd-store` and
 * `lab-store`, so a record found by a patient search is also one this will
 * match. It requires a minimum length for the same reason those do: short
 * fragments collide, and "same patient" is a decision that moves money.
 */

/** Fewer digits than this and a suffix match stops meaning anything. */
const MIN_MATCHABLE_DIGITS = 6;

/** Exact digits — the stable key patient-scoped records are filed under. */
export function patientKey(phone: string | undefined | null): string {
  return String(phone ?? "").replace(/\D/g, "");
}

/**
 * Whether two separately-captured phone numbers denote the same patient,
 * tolerating a country code on one side but not the other.
 */
export function isSamePatient(left: string | undefined | null, right: string | undefined | null): boolean {
  const a = patientKey(left);
  const b = patientKey(right);
  if (a.length < MIN_MATCHABLE_DIGITS || b.length < MIN_MATCHABLE_DIGITS) return false;
  return a === b || a.endsWith(b) || b.endsWith(a);
}
