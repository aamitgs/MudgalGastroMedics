"use client";

import { AlertTriangle, CalendarClock, FlaskConical, PiggyBank, Pill, ShieldAlert, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { AppointmentRecord } from "@/lib/appointment-types";
import type { ClinicalEvent } from "@/lib/hospital-os-data";
import type { IpdAdmission } from "@/lib/ipd-types";
import type { LabOrder } from "@/lib/lab-types";
import type { OpdVisit } from "@/lib/opd-types";
import type { PatientRecord } from "@/lib/patient-types";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";
import { EntityDocumentsSection } from "@/components/design-system/EntityDocumentsSection";

type PatientSummary = {
  patient: PatientRecord | null;
  activeAdmission: IpdAdmission | null;
  nextAppointment: AppointmentRecord | null;
  recentVisits: OpdVisit[];
  recentLabOrders: LabOrder[];
  criticalUnacknowledged: number;
  outstanding: { amount: number; unpaidVisits: number; unpaidLabOrders: number; unpaidPharmacy: number };
  /** Advance held against this patient (Track 5.5) — shown beside the dues so reception can settle from money already in hand. */
  advanceBalance?: number;
  usesInsurance: boolean;
  timeline: ClinicalEvent[];
};

type SummaryResponse = { ok: boolean; summary?: PatientSummary; error?: string };

const quickActions = [
  { label: "Book appointment", href: "/admin#module-appointments" },
  { label: "OPD queue", href: "/admin#module-opd" },
  { label: "Order lab test", href: "/admin#module-lab" },
  { label: "Billing", href: "/admin#module-billing" },
  { label: "Admit / IPD", href: "/admin#module-ipd" },
  { label: "Pharmacy", href: "/admin#module-pharmacy" }
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line px-5 py-3.5">
      <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-muted">{title}</h3>
      <div className="mt-1.5">{children}</div>
    </section>
  );
}

/**
 * Global Patient Drawer (Track 2.1): patient context from any module in one
 * click, no navigation. Safety information (allergies, unacknowledged critical
 * results) always renders first and is explicit even when empty.
 */
export function PatientDrawer() {
  const { open, phone, patientName, closeDrawer } = usePatientDrawerStore();
  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !phone) return;
    let active = true;

    async function loadSummary() {
      if (!active) return;
      setLoading(true);
      setSummary(null);
      setError("");
      const response = await fetch(`/api/patients/summary?phone=${encodeURIComponent(phone)}`, { cache: "no-store" }).catch(() => null);
      if (!active) return;
      const data = ((await response?.json().catch(() => ({}))) ?? {}) as SummaryResponse;
      if (!response?.ok || !data.ok || !data.summary) {
        setError(data.error || "Unable to load patient summary.");
        setLoading(false);
        return;
      }
      setSummary(data.summary);
      setLoading(false);
    }

    // Deferred a tick so state updates never run synchronously inside the effect body.
    const start = window.setTimeout(() => void loadSummary(), 0);
    return () => {
      active = false;
      window.clearTimeout(start);
    };
  }, [open, phone]);

  const patient = summary?.patient ?? null;

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? undefined : closeDrawer())}>
      <SheetContent aria-describedby={undefined}>
        <SheetHeader className="pr-12">
          <SheetTitle>{patient?.name || patientName || "Patient"}</SheetTitle>
          <SheetDescription>
            {patient
              ? [patient.uhid, [patient.age, patient.gender].filter(Boolean).join("/"), patient.bloodGroup ? `Blood ${patient.bloodGroup}` : "", patient.status]
                  .filter(Boolean)
                  .join(" · ")
              : `Phone ${phone}`}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? <p className="px-5 py-4 text-sm font-semibold text-muted">Loading patient context…</p> : null}
          {error ? <p className="px-5 py-4 text-sm font-semibold text-coral">{error}</p> : null}

          {summary ? (
            <>
              <Section title="Safety">
                {patient?.allergies ? (
                  <p className="flex items-start gap-2 rounded border border-red-200 bg-red-50 p-2.5 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                    <ShieldAlert size={16} className="mt-0.5 shrink-0" /> Allergies: {patient.allergies}
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-muted">No allergies recorded.</p>
                )}
                {summary.criticalUnacknowledged > 0 ? (
                  <p className="mt-2 flex items-start gap-2 rounded border border-red-200 bg-red-50 p-2.5 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    {summary.criticalUnacknowledged} critical lab result{summary.criticalUnacknowledged === 1 ? "" : "s"} awaiting acknowledgement.
                  </p>
                ) : null}
                {patient?.chronicConditions ? <p className="mt-2 text-sm text-muted">Chronic: {patient.chronicConditions}</p> : null}
              </Section>

              <Section title="Current medication">
                <p className="flex items-start gap-2 text-sm text-muted">
                  <Pill size={15} className="mt-0.5 shrink-0 text-brand" />
                  {patient?.currentMedicines || "None recorded."}
                </p>
              </Section>

              <Section title="Clinical state">
                {summary.activeAdmission ? (
                  <p className="text-sm font-semibold text-ink">
                    Admitted · {summary.activeAdmission.ward}, bed {summary.activeAdmission.bedLabel}
                    <span className="block font-normal text-muted">
                      {summary.activeAdmission.diagnosis || "Diagnosis not noted"} · {summary.activeAdmission.admittingDoctor}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-muted">Not currently admitted.</p>
                )}
                <p className="mt-2 flex items-start gap-2 text-sm text-muted">
                  <CalendarClock size={15} className="mt-0.5 shrink-0 text-brand" />
                  {summary.nextAppointment
                    ? `Next: ${summary.nextAppointment.service} · ${summary.nextAppointment.date || "date flexible"} ${summary.nextAppointment.timeSlot || ""} (${summary.nextAppointment.status})`
                    : "No upcoming appointment."}
                </p>
              </Section>

              <Section title="Billing">
                <p className="flex items-start gap-2 text-sm">
                  <Wallet size={15} className="mt-0.5 shrink-0 text-brand" />
                  {summary.outstanding.amount > 0 ? (
                    <span className="font-bold text-gold">
                      Rs {summary.outstanding.amount.toLocaleString("en-IN")} outstanding
                      <span className="block text-xs font-semibold text-muted">
                        {[
                          summary.outstanding.unpaidVisits ? `${summary.outstanding.unpaidVisits} OPD` : "",
                          summary.outstanding.unpaidLabOrders ? `${summary.outstanding.unpaidLabOrders} lab` : "",
                          summary.outstanding.unpaidPharmacy ? `${summary.outstanding.unpaidPharmacy} pharmacy` : ""
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                  ) : (
                    <span className="font-semibold text-muted">No outstanding balance.</span>
                  )}
                </p>
                {summary.advanceBalance ? (
                  <p className="mt-1.5 flex items-start gap-2 text-sm">
                    <PiggyBank size={15} className="mt-0.5 shrink-0 text-teal-dark" />
                    <span className="font-bold text-teal-dark">
                      Rs {summary.advanceBalance.toLocaleString("en-IN")} advance available
                      {summary.outstanding.amount > 0 ? (
                        <span className="block text-xs font-semibold text-muted">Can be applied against the dues above.</span>
                      ) : null}
                    </span>
                  </p>
                ) : null}
                <p className="mt-1.5 text-xs font-semibold text-muted">{summary.usesInsurance ? "Insurance used previously." : "Self-pay history."}</p>
              </Section>

              {summary.recentLabOrders.length ? (
                <Section title="Recent lab orders">
                  <ul className="grid gap-1.5">
                    {summary.recentLabOrders.map((order) => (
                      <li key={order.id} className="flex items-start gap-2 text-sm text-muted">
                        <FlaskConical size={14} className="mt-0.5 shrink-0 text-brand" />
                        <span className="min-w-0">
                          {order.tests.join(", ") || order.service} · {order.status}
                          {order.criticalFlag ? (
                            <span className="ml-1.5 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-black uppercase text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                              Critical
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              ) : null}

              <Section title="Recent activity">
                {summary.timeline.length ? (
                  <ul className="grid gap-2">
                    {summary.timeline.map((event, index) => (
                      <li key={`${event.time}-${index}`} className="grid grid-cols-[92px_minmax(0,1fr)] gap-2 text-xs leading-5">
                        <span className="font-semibold text-brand">{event.time}</span>
                        <span className="min-w-0 text-muted">
                          <span className="font-bold text-ink">{event.title}</span> — {event.detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No recorded activity yet.</p>
                )}
              </Section>

              {patient?.id ? (
                <Section title="Documents">
                  <EntityDocumentsSection entityType="patient" entityId={patient.id} />
                </Section>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="border-t border-line px-5 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted">Quick actions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <a
                key={action.label}
                href={action.href}
                onClick={closeDrawer}
                className="rounded border border-line bg-soft px-2.5 py-1.5 text-xs font-bold text-ink transition hover:border-brand hover:text-brand"
              >
                {action.label}
              </a>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
