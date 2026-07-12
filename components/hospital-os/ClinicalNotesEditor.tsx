"use client";

import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { autosaveClinicalNotes } from "@/app/mudgalgastromedics-os/actions";
import type { AuditTrailItem, PatientFlowRow } from "@/lib/hospital-os-data";

export function ClinicalNotesEditor({
  activePatient,
  onAuditEvent
}: {
  activePatient: PatientFlowRow;
  onAuditEvent: (item: Omit<AuditTrailItem, "recordedAt">) => void;
}) {
  const [clinicalNotes, setClinicalNotes] = useState(`Focused consultation for ${activePatient.patient}. Review vitals, history, prescriptions, investigations, and follow-up plan.`);
  const [noteSaveStatus, setNoteSaveStatus] = useState("Autosaved");
  const notesEdited = useRef(false);
  const noteSaveRequest = useRef(0);

  useEffect(() => {
    if (!notesEdited.current) return;

    const requestId = noteSaveRequest.current + 1;
    noteSaveRequest.current = requestId;

    const savingTimer = window.setTimeout(() => {
      setNoteSaveStatus("Autosaving...");
    }, 350);

    const autosaveTimer = window.setTimeout(async () => {
      const result = await autosaveClinicalNotes({
        patientId: activePatient.uhid,
        notes: clinicalNotes
      });
      if (noteSaveRequest.current !== requestId) return;
      if (!result.ok) {
        setNoteSaveStatus("Autosave failed");
        return;
      }
      if (result.auditId) {
        onAuditEvent({
          id: result.auditId,
          action: "hospital_os.clinical_notes.autosaved",
          entityType: "patient",
          entityId: activePatient.uhid
        });
      }
      setNoteSaveStatus(`Autosaved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    }, 900);

    return () => {
      window.clearTimeout(savingTimer);
      window.clearTimeout(autosaveTimer);
    };
  }, [activePatient.uhid, clinicalNotes, onAuditEvent]);

  return (
    <div className="rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-4">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={`clinical-notes-${activePatient.id}`} className="text-sm font-semibold">Clinical notes for {activePatient.patient}</Label>
        <p role="status" className="text-xs font-semibold text-[var(--hos-muted-text)]">{noteSaveStatus}</p>
      </div>
      <Textarea
        id={`clinical-notes-${activePatient.id}`}
        aria-label={`Clinical notes for ${activePatient.patient}`}
        value={clinicalNotes}
        onChange={(event) => {
          notesEdited.current = true;
          setClinicalNotes(event.target.value);
          setNoteSaveStatus("Unsaved changes");
        }}
        className="mt-3 min-h-28"
      />
    </div>
  );
}
