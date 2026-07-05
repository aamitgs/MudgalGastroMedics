import type { AuditChangeSet } from "@/lib/audit-types";

/**
 * Field-level before/after diffing for the audit trail (Track 1.6).
 *
 * Produces a compact change-set — only the fields that actually changed, each
 * as `{ before, after }` — so reviewers see "roles: [reception] → [doctor]"
 * instead of two opaque JSON blobs. Sensitive fields are redacted, and noisy
 * bookkeeping fields (timestamps) are ignored by default.
 */

type Record_ = Record<string, unknown>;

type DiffOptions = {
  /** Extra field names to skip (merged with the timestamp defaults). */
  ignore?: string[];
  /** Extra field names whose values must never be stored in plaintext. */
  redact?: string[];
};

const DEFAULT_IGNORE = ["updatedAt", "createdAt", "lastLoginAt"];
const DEFAULT_REDACT = [
  "password",
  "passwordHash",
  "newPassword",
  "currentPassword",
  "otp",
  "otpHash",
  "token",
  "secret",
  "totpSecret",
  "pin"
];

function structurallyEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  // Cheap structural compare for arrays/plain objects. Field values in this app
  // are JSON-serializable, so key-order stability holds for the common cases.
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/**
 * Returns the changed fields between `before` and `after`, or `undefined` when
 * nothing (visible) changed — so callers can conditionally attach it.
 */
export function computeAuditChanges(
  before: Record_ | null | undefined,
  after: Record_ | null | undefined,
  options?: DiffOptions
): AuditChangeSet | undefined {
  const beforeRec = before ?? {};
  const afterRec = after ?? {};
  const ignore = new Set([...DEFAULT_IGNORE, ...(options?.ignore ?? [])]);
  const redact = new Set([...DEFAULT_REDACT, ...(options?.redact ?? [])]);

  const keys = new Set([...Object.keys(beforeRec), ...Object.keys(afterRec)]);
  const changes: AuditChangeSet = {};

  for (const key of keys) {
    if (ignore.has(key)) continue;
    const previous = beforeRec[key];
    const next = afterRec[key];
    if (structurallyEqual(previous, next)) continue;

    if (redact.has(key)) {
      changes[key] = {
        before: previous === undefined ? undefined : "[redacted]",
        after: next === undefined ? undefined : "[redacted]"
      };
    } else {
      changes[key] = { before: previous, after: next };
    }
  }

  return Object.keys(changes).length ? changes : undefined;
}
