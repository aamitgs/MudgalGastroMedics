export type BedStatus = "Vacant" | "Occupied" | "Reserved" | "Cleaning" | "Maintenance" | "Isolation";

export type IpdAdmissionStatus = "Admitted" | "Discharged" | "Cancelled";

export type HospitalWard = "HDU" | "Private Room" | "General" | "Recovery";

export type HospitalBed = {
  id: string;
  ward: HospitalWard;
  label: string;
  status: BedStatus;
  statusUpdatedAt?: string;
  dailyRate: number;
  notes?: string;
};

export type WardMeta = {
  nurseRatio: string;
  monitoringRequirements: string;
};

export type IpdAdmission = {
  id: string;
  createdAt: string;
  updatedAt: string;
  dischargedAt?: string;
  status: IpdAdmissionStatus;
  visitId: string;
  token: string;
  patientId?: string;
  uhid?: string;
  patientName: string;
  phone: string;
  bedId: string;
  bedLabel: string;
  ward: HospitalBed["ward"];
  admissionType: "Planned" | "Emergency" | "Post Procedure" | "Observation";
  admittingDoctor: string;
  assignedNurse?: string;
  expectedDischargeDate?: string;
  diagnosis: string;
  carePlan?: string;
  nursingNotes?: string;
  dietAdvice?: string;
  depositAmount?: number;
  dischargeSummary?: string;
  markedForDischarge?: boolean;
  escalated?: boolean;
  escalationReason?: string;
  /** Recorded at intake (Track 0.7) — admission creation is rejected without it. */
  consentRecorded?: boolean;
  consentRecordedAt?: string;
};

export type VitalsReading = {
  id: string;
  admissionId: string;
  recordedAt: string;
  recordedBy: string;
  heartRate?: number;
  spo2?: number;
  bloodPressure?: string;
  temperature?: number;
  notes?: string;
};

export type BedTransfer = {
  id: string;
  admissionId: string;
  fromBedId: string;
  fromBedLabel: string;
  toBedId: string;
  toBedLabel: string;
  reason: string;
  movedBy: string;
  movedAt: string;
};

export const bedStatuses: BedStatus[] = ["Vacant", "Occupied", "Reserved", "Cleaning", "Maintenance", "Isolation"];
export const ipdAdmissionStatuses: IpdAdmissionStatus[] = ["Admitted", "Discharged", "Cancelled"];
export const hospitalWards: HospitalWard[] = ["HDU", "Private Room", "General", "Recovery"];

export const wardMeta: Record<HospitalWard, WardMeta> = {
  HDU: { nurseRatio: "1 nurse : 2 patients", monitoringRequirements: "Continuous vitals monitoring, hourly checks" },
  "Private Room": { nurseRatio: "1 nurse : 4 patients", monitoringRequirements: "Routine vitals every 6 hours" },
  General: { nurseRatio: "1 nurse : 6 patients", monitoringRequirements: "Routine vitals every 8 hours" },
  Recovery: { nurseRatio: "1 nurse : 3 patients", monitoringRequirements: "Vitals every 2 hours post-procedure" }
};

/** Beyond this many minutes since the last HDU vitals check, the bed map flags it for staff attention. */
export const hduVitalsOverdueMinutes = 60;

/** Beds sitting in Cleaning status longer than this are flagged as overdue turnover. */
export const turnoverOverdueMinutes = 120;

export type HduEscalation = {
  overdue: boolean;
  outOfThreshold: boolean;
  lastVitalsAt?: string;
  flagged: boolean;
};

/**
 * Staff-attention flag only: never a diagnosis. Flags an HDU admission when its last vitals
 * check is overdue or a reading falls outside a simple monitoring threshold.
 */
export function computeHduEscalation(admission: IpdAdmission, vitals: VitalsReading[], now = Date.now()): HduEscalation {
  const admissionVitals = vitals.filter((item) => item.admissionId === admission.id);
  const latest = admissionVitals[0];
  const lastRecordedAt = latest?.recordedAt ?? admission.createdAt;
  const minutesSince = (now - new Date(lastRecordedAt).getTime()) / 60000;
  const overdue = minutesSince > hduVitalsOverdueMinutes;

  const outOfThreshold = Boolean(
    latest &&
      ((latest.spo2 !== undefined && latest.spo2 < 92) ||
        (latest.heartRate !== undefined && (latest.heartRate < 50 || latest.heartRate > 130)) ||
        (latest.temperature !== undefined && latest.temperature > 39))
  );

  return {
    overdue,
    outOfThreshold,
    lastVitalsAt: latest?.recordedAt,
    flagged: overdue || outOfThreshold || Boolean(admission.escalated)
  };
}
