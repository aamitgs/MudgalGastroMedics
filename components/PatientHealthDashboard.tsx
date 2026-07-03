"use client";

import {
  Bell,
  CalendarClock,
  CreditCard,
  FileText,
  HeartPulse,
  MessageCircle,
  Phone,
  Pill,
  Plus,
  Printer,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UsersRound,
  Video
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/design-system/EmptyState";
import { familyRelations } from "@/lib/family-types";
import type { FamilyMember } from "@/lib/family-types";
import { site } from "@/lib/site-data";

export type PatientAppointmentSummary = {
  id: string;
  uhid?: string;
  createdAt: string;
  status: string;
  name: string;
  service: string;
  date?: string;
  timeSlot?: string;
  priority?: string;
  symptoms: string[];
  report?: string;
};

export type PatientVisitSummary = {
  id: string;
  token: string;
  createdAt: string;
  status: string;
  patientName: string;
  uhid?: string;
  service: string;
  priority?: string;
  symptoms: string[];
  billingStatus: string;
  estimatedAmount?: string;
  paymentMethod?: string;
  receiptId?: string;
  clinicalNote?: string;
  prescription?: string;
  advice?: string;
  followUpDate?: string;
};

export type PatientIpdAdmissionSummary = {
  id: string;
  status: string;
  createdAt: string;
  dischargedAt?: string;
  patientName: string;
  uhid?: string;
  bedLabel: string;
  ward: string;
  admittingDoctor: string;
  assignedNurse?: string;
  expectedDischargeDate?: string;
  diagnosis: string;
  dischargeSummary?: string;
};

export type PatientVitalsPoint = {
  id: string;
  recordedAt: string;
  heartRate?: number;
  spo2?: number;
  bloodPressure?: string;
  temperature?: number;
};

export type PatientInsuranceClaimSummary = {
  id: string;
  createdAt: string;
  insurer: string;
  policyNumber?: string;
  claimNumber?: string;
  requestedAmount: number;
  approvedAmount: number;
  settledAmount: number;
  status: string;
};

type TimelineEvent = {
  id: string;
  at: string;
  title: string;
  subtitle: string;
  icon: typeof Stethoscope;
};

type PatientHealthDashboardProps = {
  phone: string;
  appointments: PatientAppointmentSummary[];
  visits: PatientVisitSummary[];
  ipdAdmissions: PatientIpdAdmissionSummary[];
  vitals: PatientVitalsPoint[];
  insuranceClaims: PatientInsuranceClaimSummary[];
  familyMembers: FamilyMember[];
  onAddFamilyMember: (input: { name: string; relation: string; age?: string; phone?: string }) => Promise<void>;
  onRemoveFamilyMember: (id: string) => Promise<void>;
  onPrintVisit: (visit: PatientVisitSummary) => void;
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(iso?: string) {
  if (!iso) return "Not set";
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function PatientHealthDashboard({
  phone,
  appointments,
  visits,
  ipdAdmissions,
  vitals,
  insuranceClaims,
  familyMembers,
  onAddFamilyMember,
  onRemoveFamilyMember,
  onPrintVisit
}: PatientHealthDashboardProps) {
  const [familyError, setFamilyError] = useState("");

  const patientName = visits[0]?.patientName ?? appointments[0]?.name ?? "there";
  const uhid = visits[0]?.uhid ?? appointments[0]?.uhid ?? ipdAdmissions[0]?.uhid;

  const upcomingAppointments = useMemo(
    () => appointments.filter((appointment) => !["Completed", "Cancelled"].includes(appointment.status)),
    [appointments]
  );

  const reminders = useMemo(() => {
    const items: { id: string; message: string }[] = [];
    for (const visit of visits) {
      if (visit.followUpDate) items.push({ id: `${visit.id}-followup`, message: `Follow-up visit suggested on ${visit.followUpDate} for ${visit.service}.` });
    }
    for (const admission of ipdAdmissions) {
      if (admission.status === "Admitted" && admission.expectedDischargeDate) {
        items.push({ id: `${admission.id}-discharge`, message: `Expected discharge from ${admission.bedLabel} around ${formatDate(admission.expectedDischargeDate)}.` });
      }
    }
    return items;
  }, [visits, ipdAdmissions]);

  const timeline = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];
    for (const appointment of appointments) {
      events.push({
        id: `appt-${appointment.id}`,
        at: appointment.createdAt,
        title: `Appointment request: ${appointment.service}`,
        subtitle: `Status: ${appointment.status}`,
        icon: CalendarClock
      });
    }
    for (const visit of visits) {
      events.push({
        id: `visit-${visit.id}`,
        at: visit.createdAt,
        title: `OPD visit: ${visit.service}`,
        subtitle: `Token ${visit.token} · ${visit.status}`,
        icon: Stethoscope
      });
    }
    for (const admission of ipdAdmissions) {
      events.push({
        id: `ipd-${admission.id}`,
        at: admission.createdAt,
        title: `Admitted: ${admission.ward} · ${admission.bedLabel}`,
        subtitle: admission.diagnosis || "Inpatient admission",
        icon: HeartPulse
      });
      if (admission.dischargedAt) {
        events.push({
          id: `ipd-${admission.id}-discharge`,
          at: admission.dischargedAt,
          title: `Discharged from ${admission.bedLabel}`,
          subtitle: admission.dischargeSummary || "Discharge recorded",
          icon: ShieldCheck
        });
      }
    }
    return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [appointments, visits, ipdAdmissions]);

  const vitalsChartData = useMemo(
    () =>
      [...vitals]
        .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
        .map((point) => ({
          time: new Date(point.recordedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
          heartRate: point.heartRate,
          spo2: point.spo2
        })),
    [vitals]
  );

  async function submitFamilyMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFamilyError("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    if (!name) {
      setFamilyError("Name is required.");
      return;
    }
    await onAddFamilyMember({
      name,
      relation: String(form.get("relation") ?? "Other"),
      age: String(form.get("age") ?? "") || undefined,
      phone: String(form.get("phone") ?? "") || undefined
    });
    event.currentTarget.reset();
  }

  return (
    <div className="hospital-os-theme grid gap-6 rounded-xl border border-[var(--hos-border)] bg-[var(--hos-bg)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--hos-muted-text)]">{greeting()},</p>
          <h2 className="mt-1 text-3xl font-semibold text-[var(--hos-text)]">{patientName}</h2>
          {uhid ? <p className="mt-1 text-sm text-[var(--hos-muted-text)]">UHID: {uhid}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${site.phone}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--hos-border)] bg-[var(--hos-surface)] px-4 text-sm font-semibold text-[var(--hos-text)] transition hover:border-[var(--hos-primary)]">
            <Phone size={16} /> Call
          </a>
          <a
            href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent("Hello, I would like to start a teleconsultation.")}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-500/20 dark:text-emerald-300"
          >
            <Video size={16} /> Start Teleconsultation
          </a>
          <a href={`https://wa.me/${site.whatsapp}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--hos-border)] bg-[var(--hos-surface)] px-4 text-sm font-semibold text-[var(--hos-text)] transition hover:border-[var(--hos-primary)]">
            <MessageCircle size={16} /> WhatsApp
          </a>
        </div>
      </div>

      {reminders.length > 0 ? (
        <div className="grid gap-2">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="flex items-start gap-2 rounded-lg border border-[var(--hos-primary)]/30 bg-[var(--hos-primary)]/10 p-3 text-sm text-[var(--hos-text)]">
              <Bell size={16} className="mt-0.5 shrink-0 text-[var(--hos-primary)]" />
              <span>{reminder.message}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6">
          <section className="rounded-lg border border-[var(--hos-border)] bg-[var(--hos-surface)] p-5">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--hos-text)]"><CalendarClock size={18} className="text-[var(--hos-primary)]" /> Upcoming appointments</h3>
            {upcomingAppointments.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--hos-muted-text)]">No upcoming appointment requests right now.</p>
            ) : (
              <div className="mt-3 grid gap-3">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-[var(--hos-text)]">{appointment.service}</p>
                      <span className="rounded-full border border-[var(--hos-border)] px-3 py-1 text-xs font-semibold text-[var(--hos-muted-text)]">{appointment.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--hos-muted-text)]">{appointment.date || "Flexible date"} · {appointment.timeSlot || "Flexible time"}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-[var(--hos-border)] bg-[var(--hos-surface)] p-5">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--hos-text)]"><HeartPulse size={18} className="text-[var(--hos-primary)]" /> Medical timeline</h3>
            {timeline.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--hos-muted-text)]">Your visit history will appear here once you have an appointment or visit on record.</p>
            ) : (
              <div className="mt-4 grid gap-4 border-l-2 border-[var(--hos-border)] pl-4">
                {timeline.map((event) => (
                  <div key={event.id} className="relative">
                    <span className="absolute -left-[23px] grid h-6 w-6 place-items-center rounded-full border border-[var(--hos-border)] bg-[var(--hos-surface)] text-[var(--hos-primary)]">
                      <event.icon size={13} />
                    </span>
                    <p className="text-xs text-[var(--hos-muted-text)]">{formatDate(event.at)}</p>
                    <p className="font-semibold text-[var(--hos-text)]">{event.title}</p>
                    <p className="text-sm text-[var(--hos-muted-text)]">{event.subtitle}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {vitalsChartData.length > 0 ? (
            <section className="rounded-lg border border-[var(--hos-border)] bg-[var(--hos-surface)] p-5">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--hos-text)]"><HeartPulse size={18} className="text-[var(--hos-primary)]" /> Vitals trend</h3>
              <p className="mt-1 text-sm text-[var(--hos-muted-text)]">From your recent inpatient monitoring. For reference only — always follow your care team&apos;s advice.</p>
              <div className="mt-4 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={vitalsChartData}>
                    <defs>
                      <linearGradient id="heartRateFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.24} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--hos-border)" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="heartRate" name="Heart rate (bpm)" stroke="#2563EB" fill="url(#heartRateFill)" />
                    <Area type="monotone" dataKey="spo2" name="SpO2 (%)" stroke="#16A34A" fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          ) : null}

          <section className="rounded-lg border border-[var(--hos-border)] bg-[var(--hos-surface)] p-5">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--hos-text)]"><Pill size={18} className="text-[var(--hos-primary)]" /> Reports &amp; prescriptions</h3>
            {visits.filter((visit) => visit.prescription || visit.clinicalNote || visit.advice).length === 0 ? (
              <p className="mt-3 text-sm text-[var(--hos-muted-text)]">Prescriptions and doctor notes will appear here after your consultation is recorded.</p>
            ) : (
              <div className="mt-3 grid gap-3">
                {visits
                  .filter((visit) => visit.prescription || visit.clinicalNote || visit.advice)
                  .map((visit) => (
                    <div key={visit.id} className="rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-[var(--hos-text)]">{visit.service} · {formatDate(visit.createdAt)}</p>
                        <button type="button" onClick={() => onPrintVisit(visit)} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--hos-primary)]">
                          <Printer size={14} /> Print
                        </button>
                      </div>
                      {visit.clinicalNote ? <p className="mt-2 whitespace-pre-line text-sm text-[var(--hos-muted-text)]"><span className="font-semibold text-[var(--hos-text)]">Summary: </span>{visit.clinicalNote}</p> : null}
                      {visit.prescription ? <p className="mt-2 whitespace-pre-line text-sm text-[var(--hos-muted-text)]"><span className="font-semibold text-[var(--hos-text)]">Prescription: </span>{visit.prescription}</p> : null}
                      {visit.advice ? <p className="mt-2 whitespace-pre-line text-sm text-[var(--hos-muted-text)]"><span className="font-semibold text-[var(--hos-text)]">Advice: </span>{visit.advice}</p> : null}
                    </div>
                  ))}
              </div>
            )}
          </section>
        </div>

        <div className="grid gap-6">
          <section className="rounded-lg border border-[var(--hos-border)] bg-[var(--hos-surface)] p-5">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--hos-text)]"><CreditCard size={18} className="text-[var(--hos-primary)]" /> Bills &amp; payments</h3>
            {visits.length === 0 && insuranceClaims.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--hos-muted-text)]">No billing activity on record yet.</p>
            ) : (
              <div className="mt-3 grid gap-3">
                {visits.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-3 text-sm">
                    <div>
                      <p className="font-semibold text-[var(--hos-text)]">{visit.service}</p>
                      <p className="text-[var(--hos-muted-text)]">{visit.estimatedAmount ? `Rs. ${visit.estimatedAmount}` : "Not billed"}{visit.paymentMethod ? ` · ${visit.paymentMethod}` : ""}</p>
                    </div>
                    <span className="rounded-full border border-[var(--hos-border)] px-3 py-1 text-xs font-semibold text-[var(--hos-muted-text)]">{visit.billingStatus}</span>
                  </div>
                ))}
                {insuranceClaims.map((claim) => (
                  <div key={claim.id} className="rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-[var(--hos-text)]">{claim.insurer} claim</p>
                      <span className="rounded-full border border-[var(--hos-border)] px-3 py-1 text-xs font-semibold text-[var(--hos-muted-text)]">{claim.status}</span>
                    </div>
                    <p className="mt-1 text-[var(--hos-muted-text)]">Requested Rs. {claim.requestedAmount.toLocaleString("en-IN")} · Approved Rs. {claim.approvedAmount.toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-[var(--hos-border)] bg-[var(--hos-surface)] p-5">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--hos-text)]"><UsersRound size={18} className="text-[var(--hos-primary)]" /> Family members</h3>
            <p className="mt-1 text-sm text-[var(--hos-muted-text)]">Manage family profiles for faster appointment booking.</p>
            <div className="mt-3 grid gap-2">
              {familyMembers.length === 0 ? (
                <p className="text-sm text-[var(--hos-muted-text)]">No family members added yet.</p>
              ) : (
                familyMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-3 text-sm">
                    <div>
                      <p className="font-semibold text-[var(--hos-text)]">{member.name}</p>
                      <p className="text-[var(--hos-muted-text)]">{member.relation}{member.age ? ` · ${member.age} yrs` : ""}</p>
                    </div>
                    <button type="button" onClick={() => onRemoveFamilyMember(member.id)} aria-label={`Remove ${member.name}`} className="rounded p-1.5 text-[var(--hos-muted-text)] hover:bg-[var(--hos-danger)]/10 hover:text-[var(--hos-danger)]">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={submitFamilyMember} className="mt-4 grid gap-2 border-t border-[var(--hos-border)] pt-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <input name="name" placeholder="Full name" required className="min-h-9 rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] px-3 text-sm text-[var(--hos-text)]" />
                <select name="relation" defaultValue="Spouse" className="min-h-9 rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] px-3 text-sm text-[var(--hos-text)]">
                  {familyRelations.map((relation) => <option key={relation}>{relation}</option>)}
                </select>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input name="age" placeholder="Age (optional)" className="min-h-9 rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] px-3 text-sm text-[var(--hos-text)]" />
                <input name="phone" placeholder="Phone (optional)" className="min-h-9 rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] px-3 text-sm text-[var(--hos-text)]" />
              </div>
              {familyError ? <p className="text-sm font-semibold text-[var(--hos-danger)]">{familyError}</p> : null}
              <button type="submit" className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[var(--hos-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--hos-primary)]/90">
                <Plus size={15} /> Add family member
              </button>
            </form>
          </section>

          {ipdAdmissions.length === 0 && visits.length === 0 && appointments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nothing on record yet"
              description={`No appointments, visits or admissions found for ${phone}. Once reception processes your request, it will show up here.`}
              action="Call Reception"
              onAction={() => window.open(`tel:${site.phone}`)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
