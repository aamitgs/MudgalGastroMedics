"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmAiPrescriptionSuggestion } from "@/app/mudgalgastromedics-os/actions";
import type { AuditTrailItem, PatientFlowRow } from "@/lib/hospital-os-data";

export function AiPrescriptionAssistant({
  activePatient,
  onAuditEvent
}: {
  activePatient: PatientFlowRow;
  onAuditEvent: (item: Omit<AuditTrailItem, "recordedAt">) => void;
}) {
  const [status, setStatus] = useState<"idle" | "confirmed" | "error">("idle");
  const [isPending, startTransition] = useTransition();
  const suggestion = `Continue PPI therapy, add hydration advice, and schedule follow-up review for ${activePatient.risk.toLowerCase()} risk profile.`;

  function confirmSuggestion() {
    setStatus("idle");
    startTransition(async () => {
      const result = await confirmAiPrescriptionSuggestion({
        patientId: activePatient.uhid,
        suggestion
      });
      if (!result.ok) {
        setStatus("error");
        return;
      }
      if (result.auditId) {
        onAuditEvent({
          id: result.auditId,
          action: "hospital_os.ai_prescription.confirmed",
          entityType: "patient",
          entityId: activePatient.uhid
        });
      }
      setStatus("confirmed");
    });
  }

  return (
    <div className="rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">AI prescription assistance</p>
          <p className="mt-2 text-sm leading-6 text-[var(--hos-muted-text)]">{suggestion}</p>
          <p className="mt-2 text-xs font-semibold text-[var(--hos-warning)]">Suggestion only. Doctor confirmation is required before saving.</p>
        </div>
        <Sparkles size={18} className="shrink-0 text-[var(--hos-primary)]" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" disabled={isPending || status === "confirmed"} onClick={confirmSuggestion} className="bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]/90">
          {isPending ? "Confirming..." : status === "confirmed" ? "Confirmed" : "Confirm Suggestion"}
        </Button>
        {status === "confirmed" ? <p role="status" className="text-sm font-semibold text-[var(--hos-success)]">Doctor confirmed AI suggestion.</p> : null}
        {status === "error" ? <p role="alert" className="text-sm font-semibold text-[var(--hos-danger)]">Suggestion could not be confirmed.</p> : null}
      </div>
    </div>
  );
}
