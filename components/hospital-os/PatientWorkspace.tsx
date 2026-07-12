"use client";

import { FileText, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/design-system/EmptyState";
import { PatientClinicalSnapshot } from "@/components/hospital-os/PatientClinicalSnapshot";
import { PatientTimelinePanel } from "@/components/hospital-os/PatientTimelinePanel";
import { useHospitalOsStore } from "@/stores/hospital-os-store";
import type { PatientFlowRow } from "@/lib/hospital-os-data";

export function PatientWorkspace({ rows }: { rows: PatientFlowRow[] }) {
  const activePatientId = useHospitalOsStore((state) => state.activePatientId);
  const activePatient = rows.find((patient) => patient.id === activePatientId) ?? rows[0];

  if (!activePatient) {
    return (
      <Card id="patient-workspace" className="scroll-mt-20 rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
        <CardContent className="p-6 text-sm text-[var(--hos-muted-text)]">
          No patients in today&rsquo;s flow yet. Registrations and OPD visits appear here automatically.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="patient-workspace" className="scroll-mt-20 rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
      <CardHeader className="border-b border-[var(--hos-border)]">
        <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">Patient workspace</p>
        <CardTitle className="text-2xl font-semibold">{activePatient.patient} <span className="text-base font-medium text-[var(--hos-muted-text)]">{activePatient.uhid}</span></CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <Tabs defaultValue="summary" className="grid gap-5">
          <TabsList className="h-auto flex-wrap justify-start bg-[var(--hos-muted)] p-1">
            {["summary", "timeline", "vitals", "prescriptions", "reports", "billing", "insurance", "appointments", "notes", "ai"].map((tab) => (
              <TabsTrigger key={tab} value={tab} className="capitalize">{tab === "ai" ? "AI Summary" : tab}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="summary" className="mt-0 grid gap-4">
            <PatientClinicalSnapshot activePatient={activePatient} />
          </TabsContent>
          <TabsContent value="timeline" className="mt-0">
            <PatientTimelinePanel phone={activePatient.phone} patientName={activePatient.patient} />
          </TabsContent>
          {["vitals", "prescriptions", "reports", "billing", "insurance", "appointments", "notes", "ai"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              <EmptyState
                icon={tab === "ai" ? Sparkles : FileText}
                title={`${tab === "ai" ? "AI Summary" : tab[0].toUpperCase() + tab.slice(1)} workspace ready`}
                description="This panel loads inside the unified patient workspace without forcing a page navigation."
                action={`Add ${tab === "ai" ? "AI" : tab} record`}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
