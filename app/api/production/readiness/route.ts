import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { createProductionReadiness } from "@/lib/production-readiness";

export async function GET(request: Request) {
  const auth = await authorize(request, "system-settings", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const readiness = createProductionReadiness();
  await recordAuditEvent({
    actorRole: "admin",
    action: "production.readiness.checked",
    entityType: "production_readiness",
    entityId: "current",
    severity: readiness.releaseGate ? "info" : "warning",
    metadata: {
      releaseGate: readiness.releaseGate,
      failedChecks: readiness.summary.failing,
      warningChecks: readiness.summary.warning,
      ...auditRequestMetadata(request)
    }
  });

  return NextResponse.json({ ok: true, readiness });
}
