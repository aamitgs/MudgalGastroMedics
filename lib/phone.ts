/**
 * Shared by every public-site form that collects a phone number
 * (AppointmentForm, BlogConsultationForm) — previously duplicated verbatim in
 * each. India numbers get a friendly "+91 XXXXXXXXXX" format; everything else
 * falls back to "<country code> <digits>".
 */
export function normalizePhoneNumber(value: FormDataEntryValue | null | undefined, countryCode = "+91") {
  const raw = String(value ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (raw.startsWith("+")) return `+${digits}`;
  if (countryCode === "+91" && digits.length === 10 && /^[6-9]/.test(digits)) return `+91 ${digits}`;
  if (countryCode === "+91" && digits.length === 11 && digits.startsWith("0") && /^[6-9]/.test(digits.slice(1))) return `+91 ${digits.slice(1)}`;
  return `${countryCode} ${digits}`;
}

export function isValidPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Stable identity key for a patient's phone number — the last ten digits.
 *
 * Distinct from `normalizePhoneNumber` above, which formats a number for
 * display. This one exists to make two records of the same patient compare
 * equal: the number reaches the system as "+91 98765 43210" from a patient
 * record and "9876543210" from a typed search, and anything keyed on the raw
 * string treats those as two different people.
 *
 * Used for audit entity ids, where splitting one patient across several ids
 * would make the access trail unable to answer who opened whose record.
 */
export function patientIdentityKey(value: string | null | undefined) {
  return String(value ?? "").replace(/\D/g, "").slice(-10);
}
