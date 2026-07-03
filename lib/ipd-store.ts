import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getOpdVisitById } from "@/lib/opd-store";
import { recordAuditEvent } from "@/lib/audit-store";
import type { BedStatus, BedTransfer, HospitalBed, IpdAdmission, IpdAdmissionStatus, VitalsReading } from "@/lib/ipd-types";

type IpdStore = {
  beds: HospitalBed[];
  admissions: IpdAdmission[];
  vitals: VitalsReading[];
  transfers: BedTransfer[];
};

const globalStore = globalThis as typeof globalThis & {
  __mgmIpdStore?: IpdStore;
};

const storeFile = join(process.cwd(), ".data", "ipd-beds.json");

const starterBeds: HospitalBed[] = [
  { id: "BED-HDU-01", ward: "HDU", label: "HDU 01", status: "Vacant", dailyRate: 4500 },
  { id: "BED-HDU-02", ward: "HDU", label: "HDU 02", status: "Vacant", dailyRate: 4500 },
  { id: "BED-PR-01", ward: "Private Room", label: "Private Room 1", status: "Vacant", dailyRate: 3500 },
  { id: "BED-PR-02", ward: "Private Room", label: "Private Room 2", status: "Vacant", dailyRate: 3500 },
  { id: "BED-REC-01", ward: "Recovery", label: "Recovery 1", status: "Vacant", dailyRate: 1800 },
  { id: "BED-GEN-01", ward: "General", label: "General 1", status: "Vacant", dailyRate: 1500 }
];

function readStoreFromDisk(): IpdStore {
  try {
    if (!existsSync(storeFile)) return { beds: starterBeds, admissions: [], vitals: [], transfers: [] };
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<IpdStore>;
    return {
      beds: Array.isArray(parsed.beds) ? parsed.beds : starterBeds,
      admissions: Array.isArray(parsed.admissions) ? parsed.admissions : [],
      vitals: Array.isArray(parsed.vitals) ? parsed.vitals : [],
      transfers: Array.isArray(parsed.transfers) ? parsed.transfers : []
    };
  } catch {
    return { beds: starterBeds, admissions: [], vitals: [], transfers: [] };
  }
}

function writeStoreToDisk(store: IpdStore) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, JSON.stringify(store, null, 2));
}

function getStore() {
  globalStore.__mgmIpdStore ??= readStoreFromDisk();
  return globalStore.__mgmIpdStore;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function setBedStatus(bed: HospitalBed, status: BedStatus) {
  bed.status = status;
  bed.statusUpdatedAt = new Date().toISOString();
}

/** Beds sitting in Cleaning status longer than this are flagged as overdue turnover. */
const turnoverOverdueMinutes = 120;

export function listBeds() {
  return getStore().beds;
}

export function listIpdAdmissions() {
  return getStore().admissions;
}

export function listPatientIpdAdmissions(phone: string) {
  const normalizedPhone = phone.replace(/\D/g, "");
  if (normalizedPhone.length < 6) return [];

  return getStore().admissions.filter((admission) => {
    const admissionPhone = admission.phone.replace(/\D/g, "");
    return admissionPhone.endsWith(normalizedPhone) || normalizedPhone.endsWith(admissionPhone);
  });
}

export function listVitals(admissionId?: string) {
  const vitals = getStore().vitals;
  return admissionId ? vitals.filter((item) => item.admissionId === admissionId) : vitals;
}

export function listTransfers(admissionId?: string) {
  const transfers = getStore().transfers;
  return admissionId ? transfers.filter((item) => item.admissionId === admissionId) : transfers;
}

export function recordVitals(input: Record<string, unknown>) {
  const store = getStore();
  const admissionId = normalizeText(input.admissionId);
  const admission = store.admissions.find((item) => item.id === admissionId && item.status === "Admitted");
  if (!admission) return { error: "Active admission not found." };

  const reading: VitalsReading = {
    id: `VIT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    admissionId,
    recordedAt: new Date().toISOString(),
    recordedBy: normalizeText(input.recordedBy) || "Duty nurse",
    heartRate: input.heartRate === undefined ? undefined : normalizeNumber(input.heartRate),
    spo2: input.spo2 === undefined ? undefined : normalizeNumber(input.spo2),
    bloodPressure: normalizeText(input.bloodPressure) || undefined,
    temperature: input.temperature === undefined ? undefined : normalizeNumber(input.temperature),
    notes: normalizeText(input.notes) || undefined
  };

  store.vitals.unshift(reading);
  writeStoreToDisk(store);
  return { reading };
}

export function setEscalation(input: { id: string; escalated: boolean; reason?: string }) {
  const store = getStore();
  const admission = store.admissions.find((item) => item.id === input.id);
  if (!admission) return null;
  admission.escalated = input.escalated;
  admission.escalationReason = input.escalated ? normalizeText(input.reason) : undefined;
  admission.updatedAt = new Date().toISOString();
  writeStoreToDisk(store);
  return admission;
}

export async function transferBed(input: { admissionId: string; toBedId: string; reason: string; movedBy: string }) {
  const store = getStore();
  const admission = store.admissions.find((item) => item.id === input.admissionId && item.status === "Admitted");
  if (!admission) return { error: "Active admission not found." };

  const fromBed = store.beds.find((bed) => bed.id === admission.bedId);
  const toBed = store.beds.find((bed) => bed.id === input.toBedId);
  if (!toBed) return { error: "Target bed not found." };
  if (toBed.status !== "Vacant") return { error: `${toBed.label} is not vacant.` };
  if (!input.reason.trim()) return { error: "Transfer reason is required." };

  if (fromBed) setBedStatus(fromBed, "Cleaning");
  setBedStatus(toBed, "Occupied");
  admission.bedId = toBed.id;
  admission.bedLabel = toBed.label;
  admission.ward = toBed.ward;
  admission.updatedAt = new Date().toISOString();

  const transfer: BedTransfer = {
    id: `TRF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    admissionId: admission.id,
    fromBedId: fromBed?.id ?? "",
    fromBedLabel: fromBed?.label ?? "Unknown",
    toBedId: toBed.id,
    toBedLabel: toBed.label,
    reason: input.reason.trim(),
    movedBy: input.movedBy || "Front desk",
    movedAt: admission.updatedAt
  };
  store.transfers.unshift(transfer);
  writeStoreToDisk(store);

  await recordAuditEvent({
    actorRole: "admin",
    actorId: transfer.movedBy,
    action: "ipd.bed.transfer",
    entityType: "ipd_admission",
    entityId: admission.id,
    severity: "info",
    metadata: {
      patientName: admission.patientName,
      fromBed: transfer.fromBedLabel,
      toBed: transfer.toBedLabel,
      reason: transfer.reason
    }
  });

  return { admission, transfer };
}

export function getOccupancyStats() {
  const { beds, admissions } = getStore();
  const wardGroups = new Map<string, HospitalBed[]>();
  for (const bed of beds) {
    wardGroups.set(bed.ward, [...(wardGroups.get(bed.ward) ?? []), bed]);
  }

  const wardOccupancy = Array.from(wardGroups.entries()).map(([ward, wardBeds]) => ({
    ward,
    total: wardBeds.length,
    occupied: wardBeds.filter((bed) => bed.status === "Occupied").length,
    occupancyPercent: Math.round((wardBeds.filter((bed) => bed.status === "Occupied").length / wardBeds.length) * 100)
  }));

  const discharged = admissions.filter((admission) => admission.status === "Discharged" && admission.dischargedAt);
  const averageLengthOfStayDays = discharged.length
    ? Math.round(
        (discharged.reduce((sum, admission) => sum + (new Date(admission.dischargedAt as string).getTime() - new Date(admission.createdAt).getTime()), 0) /
          discharged.length /
          86400000) *
          10
      ) / 10
    : 0;

  const now = Date.now();
  const projectedVacancies24h = admissions.filter((admission) => {
    if (admission.status !== "Admitted" || !admission.expectedDischargeDate) return false;
    const hoursUntil = (new Date(admission.expectedDischargeDate).getTime() - now) / 3600000;
    return hoursUntil >= 0 && hoursUntil <= 24;
  }).length;

  const cleaningBeds = beds.filter((bed) => bed.status === "Cleaning");
  const bedsOverdueTurnover = cleaningBeds.filter((bed) => {
    if (!bed.statusUpdatedAt) return false;
    return (now - new Date(bed.statusUpdatedAt).getTime()) / 60000 > turnoverOverdueMinutes;
  }).length;

  return {
    totalBeds: beds.length,
    occupiedBeds: beds.filter((bed) => bed.status === "Occupied").length,
    hospitalOccupancyPercent: Math.round((beds.filter((bed) => bed.status === "Occupied").length / beds.length) * 100),
    bedsPendingTurnover: cleaningBeds.length,
    bedsOverdueTurnover,
    averageLengthOfStayDays,
    projectedVacancies24h,
    wardOccupancy
  };
}

export function createIpdAdmission(input: Record<string, unknown>) {
  const visit = getOpdVisitById(normalizeText(input.visitId));
  if (!visit) return { error: "OPD visit not found." };

  const store = getStore();
  const bed = store.beds.find((item) => item.id === normalizeText(input.bedId));
  if (!bed) return { error: "Bed not found." };
  if (bed.status !== "Vacant") return { error: `${bed.label} is not vacant.` };

  const existing = store.admissions.find((item) => item.visitId === visit.id && item.status === "Admitted");
  if (existing) return { admission: existing };

  const now = new Date().toISOString();
  const admission: IpdAdmission = {
    id: `IPD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    createdAt: now,
    updatedAt: now,
    status: "Admitted",
    visitId: visit.id,
    token: visit.token,
    patientId: visit.patientId,
    uhid: visit.uhid,
    patientName: visit.patientName,
    phone: visit.phone,
    bedId: bed.id,
    bedLabel: bed.label,
    ward: bed.ward,
    admissionType: normalizeText(input.admissionType) as IpdAdmission["admissionType"] || "Observation",
    admittingDoctor: normalizeText(input.admittingDoctor) || "Dr. Deepak Kumar Sharma",
    assignedNurse: normalizeText(input.assignedNurse) || undefined,
    expectedDischargeDate: normalizeText(input.expectedDischargeDate) || undefined,
    diagnosis: normalizeText(input.diagnosis),
    carePlan: normalizeText(input.carePlan),
    nursingNotes: "",
    dietAdvice: "",
    depositAmount: normalizeNumber(input.depositAmount),
    dischargeSummary: ""
  };

  setBedStatus(bed, "Occupied");
  store.admissions.unshift(admission);
  writeStoreToDisk(store);
  return { admission };
}

export function updateBed(input: { id: string; status?: BedStatus; notes?: string }) {
  const bed = getStore().beds.find((item) => item.id === input.id);
  if (!bed) return null;
  if (input.status) setBedStatus(bed, input.status);
  if (typeof input.notes === "string") bed.notes = input.notes.trim();
  writeStoreToDisk(getStore());
  return bed;
}

export function updateIpdAdmission(input: {
  id: string;
  status?: IpdAdmissionStatus;
  bedId?: string;
  diagnosis?: string;
  carePlan?: string;
  nursingNotes?: string;
  dietAdvice?: string;
  depositAmount?: number;
  dischargeSummary?: string;
  assignedNurse?: string;
  expectedDischargeDate?: string;
  markedForDischarge?: boolean;
}) {
  const store = getStore();
  const admission = store.admissions.find((item) => item.id === input.id);
  if (!admission) return null;

  if (input.bedId && input.bedId !== admission.bedId && admission.status === "Admitted") {
    const nextBed = store.beds.find((bed) => bed.id === input.bedId);
    if (!nextBed || nextBed.status !== "Vacant") return null;
    const oldBed = store.beds.find((bed) => bed.id === admission.bedId);
    if (oldBed) setBedStatus(oldBed, "Cleaning");
    setBedStatus(nextBed, "Occupied");
    admission.bedId = nextBed.id;
    admission.bedLabel = nextBed.label;
    admission.ward = nextBed.ward;
  }

  if (input.status) {
    admission.status = input.status;
    if (input.status === "Discharged" || input.status === "Cancelled") {
      admission.dischargedAt ||= new Date().toISOString();
      const bed = store.beds.find((item) => item.id === admission.bedId);
      if (bed) setBedStatus(bed, input.status === "Discharged" ? "Cleaning" : "Vacant");
    }
  }
  if (typeof input.diagnosis === "string") admission.diagnosis = input.diagnosis.trim();
  if (typeof input.carePlan === "string") admission.carePlan = input.carePlan.trim();
  if (typeof input.nursingNotes === "string") admission.nursingNotes = input.nursingNotes.trim();
  if (typeof input.dietAdvice === "string") admission.dietAdvice = input.dietAdvice.trim();
  if (typeof input.depositAmount === "number" && Number.isFinite(input.depositAmount)) admission.depositAmount = input.depositAmount;
  if (typeof input.dischargeSummary === "string") admission.dischargeSummary = input.dischargeSummary.trim();
  if (typeof input.assignedNurse === "string") admission.assignedNurse = input.assignedNurse.trim() || undefined;
  if (typeof input.expectedDischargeDate === "string") admission.expectedDischargeDate = input.expectedDischargeDate.trim() || undefined;
  if (typeof input.markedForDischarge === "boolean") admission.markedForDischarge = input.markedForDischarge;
  admission.updatedAt = new Date().toISOString();

  writeStoreToDisk(store);
  return admission;
}
