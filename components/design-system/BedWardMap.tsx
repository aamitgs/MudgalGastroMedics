"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertTriangle, Bed as BedIcon, Clock, HeartPulse, History, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MetricCard } from "@/components/design-system/MetricCard";
import { EmptyState } from "@/components/design-system/EmptyState";
import { computeHduEscalation, wardMeta } from "@/lib/ipd-types";
import type { BedStatus, BedTransfer, HospitalBed, IpdAdmission, VitalsReading } from "@/lib/ipd-types";
import type { OpdVisit } from "@/lib/opd-types";

export type OccupancyStats = {
  totalBeds: number;
  occupiedBeds: number;
  hospitalOccupancyPercent: number;
  bedsPendingTurnover: number;
  bedsOverdueTurnover: number;
  averageLengthOfStayDays: number;
  projectedVacancies24h: number;
  wardOccupancy: { ward: string; total: number; occupied: number; occupancyPercent: number }[];
};

type VitalsInput = {
  heartRate?: number;
  spo2?: number;
  bloodPressure?: string;
  temperature?: number;
  notes?: string;
};

type BedWardMapProps = {
  beds: HospitalBed[];
  admissions: IpdAdmission[];
  vitals: VitalsReading[];
  transfers: BedTransfer[];
  visits: OpdVisit[];
  occupancy: OccupancyStats;
  onTransfer: (admissionId: string, toBedId: string, reason: string) => Promise<void>;
  onLogVitals: (admissionId: string, payload: VitalsInput) => Promise<void>;
  onEscalate: (admissionId: string, escalated: boolean, reason?: string) => Promise<void>;
  onBedStatus: (bedId: string, status: BedStatus) => Promise<void>;
  onMarkForDischarge: (admissionId: string, marked: boolean) => Promise<void>;
};

const statusTone: Record<BedStatus, string> = {
  Vacant: "border-[var(--hos-success)]/40 bg-[var(--hos-success)]/10 text-[var(--hos-success)]",
  Occupied: "border-[var(--hos-primary)]/40 bg-[var(--hos-primary)]/10 text-[var(--hos-primary)]",
  Reserved: "border-violet-400/50 bg-violet-400/10 text-violet-600 dark:text-violet-300",
  Cleaning: "border-[var(--hos-warning)]/40 bg-[var(--hos-warning)]/10 text-[var(--hos-warning)]",
  Maintenance: "border-[var(--hos-danger)]/40 bg-[var(--hos-danger)]/10 text-[var(--hos-danger)]",
  Isolation: "border-fuchsia-400/50 bg-fuchsia-400/10 text-fuchsia-600 dark:text-fuchsia-300"
};

function relativeTime(iso?: string) {
  if (!iso) return "No reading yet";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso?: string) {
  if (!iso) return "Not set";
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function BedWardMap({
  beds,
  admissions,
  vitals,
  transfers,
  visits,
  occupancy,
  onTransfer,
  onLogVitals,
  onEscalate,
  onBedStatus,
  onMarkForDischarge
}: BedWardMapProps) {
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [transferTarget, setTransferTarget] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [vitalsAdmissionId, setVitalsAdmissionId] = useState<string | null>(null);

  const admissionByBedId = useMemo(() => {
    const map = new Map<string, IpdAdmission>();
    for (const admission of admissions) {
      if (admission.status === "Admitted") map.set(admission.bedId, admission);
    }
    return map;
  }, [admissions]);

  const visitById = useMemo(() => {
    const map = new Map<string, OpdVisit>();
    for (const visit of visits) map.set(visit.id, visit);
    return map;
  }, [visits]);

  const wardGroups = useMemo(() => {
    const groups = new Map<string, HospitalBed[]>();
    for (const bed of beds) groups.set(bed.ward, [...(groups.get(bed.ward) ?? []), bed]);
    return Array.from(groups.entries());
  }, [beds]);

  const vacantBeds = beds.filter((bed) => bed.status === "Vacant");

  const alerts = useMemo(() => {
    const items: { tone: "warning" | "danger"; message: string }[] = [];
    for (const ward of occupancy.wardOccupancy) {
      if (ward.occupancyPercent >= 85) {
        items.push({ tone: "warning", message: `${ward.ward} ward is at ${ward.occupancyPercent}% capacity (${ward.occupied}/${ward.total} beds).` });
      }
    }
    const hduWard = occupancy.wardOccupancy.find((ward) => ward.ward === "HDU");
    if (hduWard && hduWard.occupied === hduWard.total && hduWard.total > 0) {
      items.push({ tone: "danger", message: "No HDU beds available. Escalate to duty manager before accepting a new HDU admission." });
    }
    if (occupancy.bedsOverdueTurnover > 0) {
      items.push({ tone: "warning", message: `${occupancy.bedsOverdueTurnover} bed(s) pending turnover for over 2 hours.` });
    }
    return items;
  }, [occupancy]);

  const hduAdmissions = useMemo(
    () => beds.filter((bed) => bed.ward === "HDU").map((bed) => ({ bed, admission: admissionByBedId.get(bed.id) })).filter((entry) => entry.admission),
    [beds, admissionByBedId]
  );

  const escalationByAdmissionId = useMemo(() => {
    const now = new Date().getTime();
    const map = new Map<string, ReturnType<typeof computeHduEscalation>>();
    for (const { admission } of hduAdmissions) {
      if (admission) map.set(admission.id, computeHduEscalation(admission, vitals, now));
    }
    return map;
  }, [hduAdmissions, vitals]);

  function escalationFor(admission: IpdAdmission) {
    return escalationByAdmissionId.get(admission.id) ?? { overdue: false, outOfThreshold: false, flagged: false };
  }

  const selectedBed = beds.find((bed) => bed.id === selectedBedId) ?? null;
  const selectedAdmission = selectedBed ? admissionByBedId.get(selectedBed.id) : undefined;
  const selectedVisit = selectedAdmission ? visitById.get(selectedAdmission.visitId) : undefined;

  function closeDialog() {
    setSelectedBedId(null);
    setTransferTarget("");
    setTransferReason("");
  }

  async function submitTransfer(event: FormEvent) {
    event.preventDefault();
    if (!selectedAdmission || !transferTarget) return;
    await onTransfer(selectedAdmission.id, transferTarget, transferReason);
    closeDialog();
  }

  async function submitVitals(event: FormEvent<HTMLFormElement>, admissionId: string) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await onLogVitals(admissionId, {
      heartRate: data.get("heartRate") ? Number(data.get("heartRate")) : undefined,
      spo2: data.get("spo2") ? Number(data.get("spo2")) : undefined,
      bloodPressure: (data.get("bloodPressure") as string) || undefined,
      temperature: data.get("temperature") ? Number(data.get("temperature")) : undefined,
      notes: (data.get("notes") as string) || undefined
    });
    event.currentTarget.reset();
    setVitalsAdmissionId(null);
  }

  return (
    <div className="hospital-os-theme grid gap-5 rounded-xl border border-[var(--hos-border)] bg-[var(--hos-bg)] p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--hos-primary)]">Bed, Room &amp; HDU Manager</p>
        <h2 className="mt-1 text-2xl font-semibold text-[var(--hos-text)]">Live ward map</h2>
        <p className="mt-1 max-w-2xl text-sm text-[var(--hos-muted-text)]">
          Spatial view of every bed by ward. Click a bed for admission detail, transfers, discharge prep and HDU vitals.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Hospital Occupancy" value={`${occupancy.hospitalOccupancyPercent}%`} delta={`${occupancy.occupiedBeds}/${occupancy.totalBeds} beds`} icon={BedIcon} tone="primary" />
        <MetricCard label="Avg Length of Stay" value={`${occupancy.averageLengthOfStayDays}d`} delta="Discharged admissions" icon={Clock} tone="success" />
        <MetricCard label="Pending Turnover" value={String(occupancy.bedsPendingTurnover)} delta={occupancy.bedsOverdueTurnover > 0 ? `${occupancy.bedsOverdueTurnover} overdue` : "On schedule"} icon={History} tone={occupancy.bedsOverdueTurnover > 0 ? "warning" : "success"} />
        <MetricCard label="Projected 24h Vacancies" value={String(occupancy.projectedVacancies24h)} delta="Expected discharges" icon={ShieldAlert} tone="primary" />
        <MetricCard label="HDU Watch" value={String(hduAdmissions.filter((entry) => entry.admission && escalationFor(entry.admission).flagged).length)} delta="Flagged for attention" icon={HeartPulse} tone="danger" />
      </div>

      {alerts.length > 0 ? (
        <div className="grid gap-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${alert.tone === "danger" ? "border-[var(--hos-danger)]/40 bg-[var(--hos-danger)]/10 text-[var(--hos-danger)]" : "border-[var(--hos-warning)]/40 bg-[var(--hos-warning)]/10 text-[var(--hos-warning)]"}`}
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4">
        {wardGroups.map(([ward, wardBeds]) => (
          <Card key={ward} className="rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
            <CardHeader className="pb-2">
              <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-[var(--hos-text)]">
                <span>{ward}</span>
                <span className="text-xs font-normal text-[var(--hos-muted-text)]">
                  {wardMeta[ward as keyof typeof wardMeta]?.nurseRatio} · {wardMeta[ward as keyof typeof wardMeta]?.monitoringRequirements}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {wardBeds.map((bed) => {
                  const admission = admissionByBedId.get(bed.id);
                  return (
                    <button
                      key={bed.id}
                      type="button"
                      onClick={() => setSelectedBedId(bed.id)}
                      className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition hover:opacity-80 ${statusTone[bed.status]}`}
                    >
                      <BedIcon size={18} />
                      <span className="text-sm font-semibold">{bed.label}</span>
                      <span className="text-xs">{bed.status}</span>
                      {admission ? <span className="truncate text-xs opacity-80">{admission.patientName}</span> : null}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[var(--hos-text)]">
            <HeartPulse size={18} className="text-[var(--hos-danger)]" /> HDU escalation watch
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hduAdmissions.length === 0 ? (
            <EmptyState icon={HeartPulse} title="No HDU patients admitted" description="HDU beds are currently vacant or reserved." action="View ward map" />
          ) : (
            <div className="grid gap-3">
              {hduAdmissions.map(({ bed, admission }) => {
                if (!admission) return null;
                const escalation = escalationFor(admission);
                return (
                  <div key={bed.id} className={`rounded-lg border p-4 ${escalation.flagged ? "border-[var(--hos-danger)]/40 bg-[var(--hos-danger)]/5" : "border-[var(--hos-border)] bg-[var(--hos-bg)]"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--hos-text)]">{bed.label} · {admission.patientName}</p>
                        <p className="text-xs text-[var(--hos-muted-text)]">{admission.diagnosis || "No diagnosis on file"} · Nurse: {admission.assignedNurse || "Unassigned"}</p>
                        <p className="mt-1 text-xs text-[var(--hos-muted-text)]">Last vitals: {relativeTime(escalation.lastVitalsAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {escalation.flagged ? (
                          <Badge className="border-[var(--hos-danger)]/40 bg-[var(--hos-danger)]/10 text-[var(--hos-danger)]">
                            <AlertTriangle size={12} /> For staff attention — not a diagnosis
                          </Badge>
                        ) : (
                          <Badge variant="outline">Within monitoring window</Badge>
                        )}
                        <Button type="button" size="sm" variant="outline" onClick={() => setVitalsAdmissionId(vitalsAdmissionId === admission.id ? null : admission.id)}>
                          Log vitals
                        </Button>
                        <Button type="button" size="sm" variant={admission.escalated ? "secondary" : "outline"} onClick={() => onEscalate(admission.id, !admission.escalated)}>
                          {admission.escalated ? "De-escalate" : "Escalate"}
                        </Button>
                      </div>
                    </div>
                    {vitalsAdmissionId === admission.id ? (
                      <form onSubmit={(event) => submitVitals(event, admission.id)} className="mt-3 grid gap-2 sm:grid-cols-5">
                        <input name="heartRate" type="number" placeholder="HR (bpm)" className="min-h-9 rounded border border-[var(--hos-border)] bg-[var(--hos-surface)] px-2 text-sm text-[var(--hos-text)]" />
                        <input name="spo2" type="number" placeholder="SpO2 (%)" className="min-h-9 rounded border border-[var(--hos-border)] bg-[var(--hos-surface)] px-2 text-sm text-[var(--hos-text)]" />
                        <input name="bloodPressure" placeholder="BP" className="min-h-9 rounded border border-[var(--hos-border)] bg-[var(--hos-surface)] px-2 text-sm text-[var(--hos-text)]" />
                        <input name="temperature" type="number" step="0.1" placeholder="Temp (°C)" className="min-h-9 rounded border border-[var(--hos-border)] bg-[var(--hos-surface)] px-2 text-sm text-[var(--hos-text)]" />
                        <Button type="submit" size="sm">Save</Button>
                        <input name="notes" placeholder="Notes (optional)" className="min-h-9 rounded border border-[var(--hos-border)] bg-[var(--hos-surface)] px-2 text-sm text-[var(--hos-text)] sm:col-span-5" />
                      </form>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[var(--hos-text)]">
            <History size={18} /> Recent bed transfers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transfers.length === 0 ? (
            <p className="text-sm text-[var(--hos-muted-text)]">No transfers recorded yet.</p>
          ) : (
            <div className="grid max-h-64 gap-2 overflow-auto pr-1">
              {transfers.slice(0, 20).map((transfer) => {
                const admission = admissions.find((item) => item.id === transfer.admissionId);
                return (
                  <div key={transfer.id} className="rounded border border-[var(--hos-border)] bg-[var(--hos-bg)] p-3 text-sm">
                    <p className="text-[var(--hos-text)]">
                      <span className="font-semibold">{admission?.patientName ?? "Patient"}</span>: {transfer.fromBedLabel} → {transfer.toBedLabel}
                    </p>
                    <p className="mt-1 text-xs text-[var(--hos-muted-text)]">
                      {transfer.reason} · Moved by {transfer.movedBy} · {relativeTime(transfer.movedAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedBed)} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="hospital-os-theme border-[var(--hos-border)] bg-[var(--hos-surface)] text-[var(--hos-text)] sm:max-w-lg">
          {selectedBed ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedBed.label} · {selectedBed.ward}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <Badge className={statusTone[selectedBed.status]}>{selectedBed.status}</Badge>
                  <span className="text-[var(--hos-muted-text)]">Rs. {selectedBed.dailyRate.toLocaleString("en-IN")}/day</span>
                </div>

                {selectedAdmission ? (
                  <div className="grid gap-2 rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-3">
                    <p className="font-semibold text-[var(--hos-text)]">{selectedAdmission.patientName} {selectedAdmission.uhid ? `· ${selectedAdmission.uhid}` : ""}</p>
                    <p className="text-[var(--hos-muted-text)]">Admitted: {formatDate(selectedAdmission.createdAt)}</p>
                    <p className="text-[var(--hos-muted-text)]">Expected discharge: {formatDate(selectedAdmission.expectedDischargeDate)}</p>
                    <p className="text-[var(--hos-muted-text)]">Doctor: {selectedAdmission.admittingDoctor} · Nurse: {selectedAdmission.assignedNurse || "Unassigned"}</p>
                    <p className="text-[var(--hos-muted-text)]">Diagnosis: {selectedAdmission.diagnosis || "—"}</p>
                    <p className="text-[var(--hos-muted-text)]">Billing: {selectedVisit?.billingStatus ?? "Not linked"}</p>
                    {selectedAdmission.escalated ? (
                      <p className="flex items-center gap-1 text-[var(--hos-danger)]"><AlertTriangle size={14} /> Escalated for staff attention{selectedAdmission.escalationReason ? `: ${selectedAdmission.escalationReason}` : ""}</p>
                    ) : null}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button type="button" size="sm" variant={selectedAdmission.markedForDischarge ? "secondary" : "outline"} onClick={() => onMarkForDischarge(selectedAdmission.id, !selectedAdmission.markedForDischarge)}>
                        {selectedAdmission.markedForDischarge ? "Unmark discharge" : "Mark for discharge"}
                      </Button>
                      {selectedBed.ward === "HDU" ? (
                        <Button type="button" size="sm" variant={selectedAdmission.escalated ? "secondary" : "outline"} onClick={() => onEscalate(selectedAdmission.id, !selectedAdmission.escalated)}>
                          {selectedAdmission.escalated ? "De-escalate" : "Escalate"}
                        </Button>
                      ) : null}
                    </div>

                    <form onSubmit={submitTransfer} className="mt-2 grid gap-2 border-t border-[var(--hos-border)] pt-3">
                      <p className="text-xs font-semibold uppercase text-[var(--hos-muted-text)]">Transfer patient</p>
                      <select value={transferTarget} onChange={(event) => setTransferTarget(event.target.value)} className="min-h-9 rounded border border-[var(--hos-border)] bg-[var(--hos-surface)] px-2 text-sm">
                        <option value="">Select vacant bed</option>
                        {vacantBeds.map((bed) => (
                          <option key={bed.id} value={bed.id}>{bed.label} · {bed.ward}</option>
                        ))}
                      </select>
                      <input value={transferReason} onChange={(event) => setTransferReason(event.target.value)} placeholder="Reason for transfer" className="min-h-9 rounded border border-[var(--hos-border)] bg-[var(--hos-surface)] px-2 text-sm" required />
                      <Button type="submit" size="sm" disabled={!transferTarget}>Transfer</Button>
                    </form>
                  </div>
                ) : (
                  <div className="grid gap-2 rounded-lg border border-dashed border-[var(--hos-border)] p-3">
                    <p className="text-[var(--hos-muted-text)]">No active admission in this bed.</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedBed.status === "Vacant" ? (
                        <>
                          <Button type="button" size="sm" variant="outline" onClick={() => onBedStatus(selectedBed.id, "Reserved")}>Reserve bed</Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => onBedStatus(selectedBed.id, "Maintenance")}>Flag maintenance</Button>
                        </>
                      ) : null}
                      {selectedBed.status === "Reserved" ? (
                        <Button type="button" size="sm" variant="outline" onClick={() => onBedStatus(selectedBed.id, "Vacant")}>Release reservation</Button>
                      ) : null}
                      {selectedBed.status === "Cleaning" || selectedBed.status === "Maintenance" ? (
                        <Button type="button" size="sm" variant="outline" onClick={() => onBedStatus(selectedBed.id, "Vacant")}>Mark ready</Button>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter showCloseButton />
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
