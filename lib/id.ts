/**
 * Sortable-ish, collision-resistant entity id: PREFIX-<base36 timestamp>-<base36 random>.
 * `randomLen` controls the random suffix length; keep call sites' existing length when
 * migrating an existing id format so ids already persisted stay the same shape.
 */
export function generateId(prefix: string, randomLen = 3): string {
  const random = Math.random()
    .toString(36)
    .slice(2, 2 + randomLen)
    .toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${random}`;
}

/** Width of the running number in a register serial — MGM-2026-00001. */
const SERIAL_WIDTH = 5;

/**
 * The next number in a human-readable register series: PREFIX-YYYY-00001.
 *
 * These are the numbers staff read aloud, write on paper and quote back over
 * the phone — a UHID, an admission number — so unlike generateId() they have
 * to be short and ordered. Two rules follow:
 *
 * - Derived from the highest number **already issued**, never from a count of
 *   live records. A count silently reissues the number of anything deleted,
 *   and a reused register number is indistinguishable from the original on a
 *   card the patient is still carrying.
 * - Scoped to the calendar year, which is what keeps the running number short.
 *   The year is part of the string, so the January reset stays unique.
 *
 * Numbers are burned, not recycled: a cancelled admission keeps its number and
 * the series moves past it. That gap is the point — it is what lets the
 * register be audited against the records it numbers.
 */
/**
 * What to show wherever a record has to identify itself on a **working
 * surface** — a list, a search result, a picker. Records created before their
 * register existed fall back to the daily token that was genuinely their
 * reference at the time, so staff never face a blank while a backfill is
 * pending.
 *
 * Not for anything printed under a specific label ("Admission No.", "Visit
 * No.", "Order No."). The fallback is a queue number that repeats every
 * morning, and stamping one onto a document as though it identified the record
 * is the precise confusion register numbers exist to end. Those surfaces read
 * the register field directly and omit it when absent.
 *
 * The domain wrappers — admissionReference, visitReference — delegate here so
 * the rule lives in one place.
 */
export function registerReference(registerNo: string | undefined, token: string): string {
  return registerNo ?? token;
}

export function nextSerialNumber(prefix: string, issued: Iterable<string | undefined | null>, now = new Date()): string {
  const head = `${prefix}-${now.getFullYear()}-`;
  let highest = 0;
  for (const value of issued) {
    if (!value?.startsWith(head)) continue;
    const suffix = value.slice(head.length);
    // Digits only — Number() would otherwise coerce "", " 12" and "1e9" into
    // the series, and one junk value permanently skews every later number.
    if (!/^\d+$/.test(suffix)) continue;
    const parsed = Number(suffix);
    if (parsed > highest) highest = parsed;
  }
  return `${head}${String(highest + 1).padStart(SERIAL_WIDTH, "0")}`;
}
