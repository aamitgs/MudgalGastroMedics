"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { HosFormField } from "@/components/hospital-os/HosFormField";
import { assignableDoctors, type DoctorAssignment } from "@/lib/hospital-os-data";

export function AssignDoctorDialog({
  assignment,
  setAssignment,
  error,
  isPending,
  onSave
}: {
  assignment: DoctorAssignment | null;
  setAssignment: (assignment: DoctorAssignment | null) => void;
  error: string;
  isPending: boolean;
  onSave: (assignment: DoctorAssignment) => void;
}) {
  return (
    <Dialog open={Boolean(assignment)} onOpenChange={(open) => {
      if (!open) setAssignment(null);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign doctor</DialogTitle>
          <DialogDescription>
            {assignment ? `Update responsible doctor for ${assignment.patientName}.` : "Update responsible doctor."}
          </DialogDescription>
        </DialogHeader>
        {assignment ? (
          <div className="grid gap-4">
            <HosFormField label="Doctor">
              <select
                aria-label="Assigned doctor"
                value={assignment.doctor}
                disabled={isPending}
                onChange={(event) => setAssignment({ ...assignment, doctor: event.target.value })}
                className="min-h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {assignableDoctors.map((doctor) => <option key={doctor}>{doctor}</option>)}
              </select>
            </HosFormField>
            {error ? <p role="alert" className="text-sm font-semibold text-[var(--hos-danger)]">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={isPending} onClick={() => setAssignment(null)}>Cancel</Button>
              <Button type="button" disabled={isPending} className="bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]/90" onClick={() => onSave(assignment)}>
                {isPending ? "Saving..." : "Save Assignment"}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
