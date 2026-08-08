import "server-only";

import type { AccessContext } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { patientIdentityKey } from "@/lib/phone";

/**
 * Audit trail for *reading* a patient's clinical record.
 *
 * Mutations have always been audited. Reads mostly were not, and for health
 * data who looked at a record matters as much as who changed it — an
 * unauthorised look leaves no trace to investigate, which is the case
 * access logs exist for (docs/privacy-review.md §4).
 *
 * Two deliberate limits keep this useful rather than noisy:
 *
 *   1. **Only per-patient reads.** Opening one patient's lab results is the
 *      auditable event; loading the OPD queue or a paginated patient list is
 *      routine work and logging it would bury the signal in thousands of rows
 *      a day. Endpoints that serve a list stay unaudited by design.
 *   2. **Phone is stored as a `patientIdentityKey`**, matching
 *      `patient.summary.viewed`, so every access to one patient groups under a
 *      single entity id regardless of the format the caller passed.
 *
 * Deliberately not deduplicated: a workspace that re-fetches produces repeat
 * entries. That matches the existing `patient.summary.viewed` behaviour, and a
 * dedup window would need shared state to be correct across instances. If
 * volume becomes a problem the fix belongs in audit retention
 * (docs/privacy-review.md §5), not in dropping access records.
 */

export type PatientRecordAccessKind =
  | "lab-orders"
  | "previous-prescription"
  | "previous-visit-snapshot"
  | "identity-match";

/**
 * Records that `context` read the clinical record of the patient on `phone`.
 *
 * Never throws: an audit backend problem must not take down a clinician's
 * read of a patient record mid-consultation. A failure is surfaced on the
 * server console rather than to the user, whose request is unaffected.
 */
export async function recordPatientRecordAccess(
  request: Request,
  context: AccessContext,
  kind: PatientRecordAccessKind,
  phone: string
) {
  const entityId = patientIdentityKey(phone);
  if (!entityId) return;

  try {
    await recordAuditEvent({
      actorRole: context.activeRole,
      actorId: context.userId,
      action: "patient.record.viewed",
      entityType: "patient",
      entityId,
      metadata: { kind },
      device: auditRequestMetadata(request)
    });
  } catch (error) {
    console.error("Failed to record patient record access", { kind, error });
  }
}
