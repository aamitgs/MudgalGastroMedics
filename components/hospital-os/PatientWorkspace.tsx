"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientClinicalSnapshot } from "@/components/hospital-os/PatientClinicalSnapshot";
import { PatientTimelinePanel } from "@/components/hospital-os/PatientTimelinePanel";
import { useHospitalOsStore } from "@/stores/hospital-os-store";
import type { PatientFlowRow } from "@/lib/hospital-os-data";

export function PatientWorkspace({ rows }: { rows: PatientFlowRow[] }) {
  const activePatientId = useHospitalOsStore((state) => state.activePatientId);
  const activePatient = rows.find((patient) => patient.id === activePatientId) ?? rows[0];

  if (!activePatient) {
    return (
      <div id="patient-workspace" className="scroll-mt-20 rounded-lg border border-line bg-surface">
        <div className="p-6 text-sm text-muted">
          No patients in today&rsquo;s flow yet. Registrations and OPD visits appear here automatically.
        </div>
      </div>
    );
  }

  return (
    <div id="patient-workspace" className="scroll-mt-20 rounded-lg border border-line bg-surface">
      <div className="border-b border-line p-5">
        <p className="text-xs font-semibold uppercase text-brand">Patient workspace</p>
        <h2 className="text-2xl font-semibold text-ink">{activePatient.patient} <span className="text-base font-medium text-muted">{activePatient.uhid}</span></h2>
      </div>
      <div className="p-5">
        <Tabs defaultValue="summary" className="grid gap-5">
          <TabsList className="h-auto flex-wrap justify-start bg-soft p-1">
            <TabsTrigger value="summary" className="capitalize">Summary</TabsTrigger>
            <TabsTrigger value="timeline" className="capitalize">Timeline</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="mt-0 grid gap-4">
            <PatientClinicalSnapshot activePatient={activePatient} />
          </TabsContent>
          <TabsContent value="timeline" className="mt-0">
            <PatientTimelinePanel phone={activePatient.phone} patientName={activePatient.patient} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
