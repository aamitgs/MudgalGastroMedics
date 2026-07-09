import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/design-system/EmptyState";
import type { AuditTrailItem } from "@/lib/hospital-os-data";

/** Extracted from HospitalOperatingSystem.tsx (Track 4.10) — self-contained, no shared state. */
export function AuditTrailPanel({ items }: { items: AuditTrailItem[] }) {
  return (
    <Card id="session-audit-trail" className="scroll-mt-20 rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
      <CardHeader>
        <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">DPDP-aware access record</p>
        <CardTitle className="text-xl">Session audit trail</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No session audit events yet"
            description="Successful Hospital OS mutations will appear here with their server audit IDs."
            action="Start Registration"
            onAction={() => document.querySelector("#patient-registration")?.scrollIntoView({ block: "start" })}
          />
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-[var(--hos-border)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--hos-text)]">{item.action}</p>
                    <p className="mt-1 text-xs text-[var(--hos-muted-text)]">{item.entityType}: {item.entityId}</p>
                  </div>
                  <time className="shrink-0 text-xs text-[var(--hos-muted-text)]" dateTime={item.recordedAt}>
                    {new Date(item.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </time>
                </div>
                <p className="mt-3 break-all rounded-md bg-[var(--hos-muted)] px-2 py-1 text-xs font-semibold text-[var(--hos-muted-text)]">Audit {item.id}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
