/**
 * Duplicate-medication detection (Clinical Safety, Track 0.4).
 *
 * Prescriptions and the patient's current-medicines note are both free text,
 * so this is a deliberate heuristic — a "may duplicate, verify" prompt, never
 * an authoritative check. It tokenizes both texts, drops dosage-form / frequency
 * / unit noise words, and returns candidate drug names that appear in both.
 * The UI must present the result as advisory and non-blocking.
 */
const medicationNoiseWords = new Set([
  // dosage forms
  "tab", "tabs", "tablet", "tablets", "cap", "caps", "capsule", "capsules",
  "syr", "syp", "syrup", "inj", "injection", "drop", "drops", "cream", "ointment",
  "gel", "solution", "suspension", "sachet", "powder", "lotion", "spray", "patch",
  // units
  "mg", "mcg", "gm", "gram", "grams", "ml", "iu", "unit", "units",
  // frequency / timing
  "od", "bd", "bid", "tds", "tid", "qid", "qds", "hs", "sos", "stat", "prn", "po",
  "once", "twice", "thrice", "daily", "weekly", "monthly", "morning", "noon",
  "afternoon", "evening", "night", "bedtime", "before", "after", "with", "food",
  "meal", "meals", "empty", "stomach", "days", "day", "week", "weeks", "month",
  "months", "hour", "hours", "times", "time", "dose", "doses", "course",
  // filler
  "and", "the", "for", "take", "apply", "oral", "topical", "local", "continue",
  "start", "stop", "review", "then", "each", "every", "one", "two"
]);

function normalizeToken(token: string) {
  return token.toLowerCase().replace(/[^a-z]/g, "");
}

function drugTokens(text: string): Set<string> {
  const tokens = text.split(/[\s,;/\n().\-+]+/).map(normalizeToken);
  return new Set(tokens.filter((token) => token.length >= 4 && !medicationNoiseWords.has(token)));
}

/**
 * Returns candidate drug names present in BOTH the new prescription and the
 * patient's current-medicines note. Empty when there is no overlap or either
 * input is blank.
 */
export function detectMedicationOverlap(prescription: string, currentMedicines: string): string[] {
  if (!prescription.trim() || !currentMedicines.trim()) return [];
  const prescribed = drugTokens(prescription);
  const current = drugTokens(currentMedicines);
  const overlap: string[] = [];
  for (const token of prescribed) {
    if (current.has(token)) overlap.push(token);
  }
  return overlap;
}
