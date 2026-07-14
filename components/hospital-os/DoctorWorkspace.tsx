"use client";

import type { KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiPrescriptionAssistant } from "@/components/hospital-os/AiPrescriptionAssistant";
import { ClinicalNotesEditor } from "@/components/hospital-os/ClinicalNotesEditor";
import { useHospitalOsStore } from "@/stores/hospital-os-store";
import { statusTone, type AuditTrailItem, type PatientFlowRow } from "@/lib/hospital-os-data";

export function DoctorWorkspace({
  rows,
  onAuditEvent
}: {
  rows: PatientFlowRow[];
  onAuditEvent: (item: Omit<AuditTrailItem, "recordedAt">) => void;
}) {
  const activePatientId = useHospitalOsStore((state) => state.activePatientId);
  const setActivePatient = useHospitalOsStore((state) => state.setActivePatient);
  const queueRows = rows;
  const activePatient = queueRows.find((row) => row.id === activePatientId) ?? queueRows[0];

  function onQueueKeyDown(event: KeyboardEvent<HTMLButtonElement>, patientId: string) {
    const queueButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-doctor-queue-item]"));
    const currentIndex = queueButtons.indexOf(event.currentTarget);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      queueButtons[Math.min(currentIndex + 1, queueButtons.length - 1)]?.focus();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      queueButtons[Math.max(currentIndex - 1, 0)]?.focus();
    }

    if (event.key === "Enter") {
      event.preventDefault();
      setActivePatient(patientId);
    }
  }

  return (
    <Card id="doctor-workspace" className="scroll-mt-20 rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">Doctor workspace</p>
            <CardTitle className="mt-1 text-xl">Single-screen consultation</CardTitle>
          </div>
          <Badge variant="outline" className="border-[var(--hos-border)] text-[var(--hos-muted-text)]">{rows.length} active</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {queueRows.slice(0, 4).map((row) => (
          <button
            key={row.id}
            type="button"
            data-doctor-queue-item
            aria-pressed={row.id === activePatient?.id}
            aria-label={`Select ${row.patient} consultation`}
            onClick={() => setActivePatient(row.id)}
            onKeyDown={(event) => onQueueKeyDown(event, row.id)}
            className={`rounded-lg border p-4 text-left transition hover:border-[var(--hos-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hos-primary)] ${row.id === activePatient?.id ? "border-[var(--hos-primary)] bg-[var(--hos-primary)]/5" : "border-[var(--hos-border)]"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{row.patient}</p>
                <p className="mt-1 text-xs font-medium text-[var(--hos-muted-text)]">{row.uhid} · wait {row.waitMinutes}m</p>
              </div>
              <Badge variant="outline" className={statusTone[row.status]}>{row.status}</Badge>
            </div>
          </button>
        ))}
        {activePatient ? (
          <>
            <ClinicalNotesEditor key={`notes-${activePatient.id}`} activePatient={activePatient} onAuditEvent={onAuditEvent} />
            <AiPrescriptionAssistant key={`rx-${activePatient.id}`} activePatient={activePatient} onAuditEvent={onAuditEvent} />
          </>
        ) : (
          <p className="rounded-lg border border-dashed border-[var(--hos-border)] p-4 text-sm text-[var(--hos-muted-text)]">
            No patients in the queue yet. New OPD visits appear here automatically.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
