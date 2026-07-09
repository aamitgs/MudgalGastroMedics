import { Check, ShieldCheck, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { v1AiScope } from "@/lib/hospital-os-data";

/** Extracted from HospitalOperatingSystem.tsx (Track 4.10) — self-contained, no shared state. */
export function AcceptancePanel({ flowStatus }: { flowStatus: { patientRegistration: string; appointment: string; billing: string } }) {
  return (
    <Card className="rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
      <CardHeader>
        <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">v1 scope and controls</p>
        <CardTitle className="text-xl">Acceptance coverage inside this build</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-2">
          {[
            "Role-based sidebar, top nav, branch switcher stub, and command palette",
            "Patient Workspace and Doctor Workspace as single-screen experiences",
            "Recharts dashboard with live-updating feed and polling fallback",
            "TanStack Table with sort, filter, pagination, selection, bulk actions, row menus",
            "Dark mode across the Hospital OS route",
            "Skeleton, empty, and error states without bare no-data screens",
            "DPDP-aware audit/access language without unsupported compliance claims"
          ].map((item) => (
            <div key={item} className="flex gap-3 rounded-lg border border-[var(--hos-border)] p-3 text-sm">
              <Check size={16} className="mt-0.5 text-[var(--hos-success)]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="grid gap-4">
          <Alert>
            <Sparkles size={18} />
            <AlertTitle>AI v1 scope</AlertTitle>
            <AlertDescription>{v1AiScope.join(", ")}. AI Receptionist is deferred to v2.</AlertDescription>
          </Alert>
          <Alert>
            <ShieldCheck size={18} />
            <AlertTitle>Critical flow status</AlertTitle>
            <AlertDescription>
              Registration: {flowStatus.patientRegistration}; Appointment: {flowStatus.appointment}; Billing: {flowStatus.billing}.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
