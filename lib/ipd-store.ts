import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import { generateId, nextSerialNumber } from "@/lib/id";
import { getOpdVisitById } from "@/lib/opd-store";
import { upsertPatientFromInput } from "@/lib/patient-store";
import type {
  BedStatus,
  BedTransfer,
  HospitalBed,
  HospitalWard,
  IpdAdmission,
  IpdAdmissionStatus,
  MedicationAdministration,
  MedicationOrder,
  VitalsReading
} from "@/lib/ipd-types";
import { turnoverOverdueMinutes } from "@/lib/ipd-types";

type IpdStore = {
  beds: HospitalBed[];
  admissions: IpdAdmission[];
  vitals: VitalsReading[];
  transfers: BedTransfer[];
  medicationOrders: MedicationOrder[];
  medicationAdministrations: MedicationAdministration[];
};

const starterBeds: HospitalBed[] = [
  { id: "BED-HDU-01", ward: "HDU", label: "HDU 01", status: "Vacant", dailyRate: 4500 },
  { id: "BED-HDU-02", ward: "HDU", label: "HDU 02", status: "Vacant", dailyRate: 4500 },
  { id: "BED-PR-01", ward: "Private Room", label: "Private Room 1", status: "Vacant", dailyRate: 3500 },
  { id: "BED-PR-02", ward: "Private Room", label: "Private Room 2", status: "Vacant", dailyRate: 3500 },
  { id: "BED-REC-01", ward: "Recovery", label: "Recovery 1", status: "Vacant", dailyRate: 1800 },
  { id: "BED-GEN-01", ward: "General", label: "General 1", status: "Vacant", dailyRate: 1500 }
];

const store = createDocumentStore<IpdStore>("ipd-beds", (parsed) => {
  const doc = parsed as Partial<IpdStore> | undefined;
  return {
    beds: Array.isArray(doc?.beds) ? (doc.beds as HospitalBed[]) : starterBeds,
    admissions: Array.isArray(doc?.admissions) ? (doc.admissions as IpdAdmission[]) : [],
    vitals: Array.isArray(doc?.vitals) ? (doc.vitals as VitalsReading[]) : [],
    transfers: Array.isArray(doc?.transfers) ? (doc.transfers as BedTransfer[]) : [],
    medicationOrders: Array.isArray(doc?.medicationOrders) ? (doc.medicationOrders as MedicationOrder[]) : [],
    medicationAdministrations: Array.isArray(doc?.medicationAdministrations) ? (doc.medicationAdministrations as MedicationAdministration[]) : []
  };
});

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


export async function listBeds() {
  return (await store.load()).beds;
}

export async function listIpdAdmissions() {
  return (await store.load()).admissions;
}

export async function listPatientIpdAdmissions(phone: string) {
  const normalizedPhone = phone.replace(/\D/g, "");
  if (normalizedPhone.length < 6) return [];

  return (await store.load()).admissions.filter((admission) => {
    const admissionPhone = admission.phone.replace(/\D/g, "");
    return admissionPhone.endsWith(normalizedPhone) || normalizedPhone.endsWith(admissionPhone);
  });
}

export async function listVitals(admissionId?: string) {
  const vitals = (await store.load()).vitals;
  return admissionId ? vitals.filter((item) => item.admissionId === admissionId) : vitals;
}

export async function listTransfers(admissionId?: string) {
  const transfers = (await store.load()).transfers;
  return admissionId ? transfers.filter((item) => item.admissionId === admissionId) : transfers;
}

export async function recordVitals(input: Record<string, unknown>) {
  const doc = await store.load();
  const admissionId = normalizeText(input.admissionId);
  const admission = doc.admissions.find((item) => item.id === admissionId && item.status === "Admitted");
  if (!admission) return { error: "Active admission not found." };

  const reading: VitalsReading = {
    id: generateId("VIT"),
    admissionId,
    recordedAt: new Date().toISOString(),
    recordedBy: normalizeText(input.recordedBy) || "Duty nurse",
    heartRate: input.heartRate === undefined ? undefined : normalizeNumber(input.heartRate),
    spo2: input.spo2 === undefined ? undefined : normalizeNumber(input.spo2),
    bloodPressure: normalizeText(input.bloodPressure) || undefined,
    temperature: input.temperature === undefined ? undefined : normalizeNumber(input.temperature),
    notes: normalizeText(input.notes) || undefined
  };

  doc.vitals.unshift(reading);
  await store.save(doc);
  return { reading };
}

export async function listMedicationOrders(admissionId?: string) {
  const orders = (await store.load()).medicationOrders;
  return admissionId ? orders.filter((item) => item.admissionId === admissionId) : orders;
}

export async function listMedicationAdministrations(admissionId?: string) {
  const records = (await store.load()).medicationAdministrations;
  return admissionId ? records.filter((item) => item.admissionId === admissionId) : records;
}

export async function createMedicationOrder(input: Record<string, unknown>) {
  const doc = await store.load();
  const admissionId = normalizeText(input.admissionId);
  const admission = doc.admissions.find((item) => item.id === admissionId && item.status === "Admitted");
  if (!admission) return { error: "Active admission not found." };

  const drugName = normalizeText(input.drugName);
  if (!drugName) return { error: "Drug name is required." };

  const order: MedicationOrder = {
    id: generateId("MED"),
    admissionId,
    drugName,
    dose: normalizeText(input.dose),
    route: normalizeText(input.route) || "Oral",
    frequency: normalizeText(input.frequency),
    notes: normalizeText(input.notes) || undefined,
    status: "Active",
    createdAt: new Date().toISOString(),
    createdBy: normalizeText(input.createdBy) || "Doctor"
  };

  doc.medicationOrders.unshift(order);
  await store.save(doc);
  return { order };
}

export async function discontinueMedicationOrder(id: string) {
  const doc = await store.load();
  const order = doc.medicationOrders.find((item) => item.id === id);
  if (!order) return null;
  order.status = "Discontinued";
  order.discontinuedAt = new Date().toISOString();
  await store.save(doc);
  return order;
}

export async function recordMedicationAdministration(input: Record<string, unknown>) {
  const doc = await store.load();
  const medicationOrderId = normalizeText(input.medicationOrderId);
  const order = doc.medicationOrders.find((item) => item.id === medicationOrderId);
  if (!order) return { error: "Medication order not found." };

  const status = normalizeText(input.status);
  const record: MedicationAdministration = {
    id: generateId("MAR"),
    admissionId: order.admissionId,
    medicationOrderId,
    administeredAt: new Date().toISOString(),
    administeredBy: normalizeText(input.administeredBy) || "Duty nurse",
    status: (status === "Missed" || status === "Refused" ? status : "Given"),
    notes: normalizeText(input.notes) || undefined
  };

  doc.medicationAdministrations.unshift(record);
  await store.save(doc);
  return { record };
}

export async function setEscalation(input: { id: string; escalated: boolean; reason?: string }) {
  const doc = await store.load();
  const admission = doc.admissions.find((item) => item.id === input.id);
  if (!admission) return null;
  admission.escalated = input.escalated;
  admission.escalationReason = input.escalated ? normalizeText(input.reason) : undefined;
  admission.updatedAt = new Date().toISOString();
  await store.save(doc);
  return admission;
}

export async function transferBed(input: { admissionId: string; toBedId: string; reason: string; movedBy: string }) {
  const doc = await store.load();
  const admission = doc.admissions.find((item) => item.id === input.admissionId && item.status === "Admitted");
  if (!admission) return { error: "Active admission not found." };

  const fromBed = doc.beds.find((bed) => bed.id === admission.bedId);
  const toBed = doc.beds.find((bed) => bed.id === input.toBedId);
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
    id: generateId("TRF"),
    admissionId: admission.id,
    fromBedId: fromBed?.id ?? "",
    fromBedLabel: fromBed?.label ?? "Unknown",
    toBedId: toBed.id,
    toBedLabel: toBed.label,
    reason: input.reason.trim(),
    movedBy: input.movedBy || "Front desk",
    movedAt: admission.updatedAt
  };
  doc.transfers.unshift(transfer);
  await store.save(doc);

  return { admission, transfer };
}

export async function getOccupancyStats() {
  const { beds, admissions } = await store.load();
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

export async function createIpdAdmission(input: Record<string, unknown>) {
  const visitId = normalizeText(input.visitId);

  // Two ways in, and the schema guarantees exactly one of them arrives:
  //
  //   OPD visit — the planned route. The consultation happened, the doctor
  //   advised admission, and the stay inherits the visit's patient and token.
  //
  //   Direct — an emergency who never sat in the queue. The patient record is
  //   matched by phone or registered on the spot, and the stay carries no
  //   visit or token. Nothing downstream needs one: invoices and insurance
  //   claims already key off admissionId (billing-store.ts, finance-store.ts),
  //   and admissionReference() falls back to the register number, which every
  //   admission is issued.
  const visit = visitId ? await getOpdVisitById(visitId) : null;
  if (visitId && !visit) return { error: "OPD visit not found." };

  const patient = visit
    ? null
    : await upsertPatientFromInput({
        name: normalizeText(input.patientName),
        phone: normalizeText(input.phone),
        age: normalizeText(input.age),
        gender: normalizeText(input.gender)
      });

  const identity = visit
    ? { visitId: visit.id, token: visit.token, patientId: visit.patientId, uhid: visit.uhid, patientName: visit.patientName, phone: visit.phone }
    : { visitId: "", token: "", patientId: patient!.id, uhid: patient!.uhid, patientName: patient!.name, phone: patient!.phone };

  const doc = await store.load();

  // Checked ahead of the bed so the patient-level fact wins: re-submitting
  // someone who is already an inpatient used to surface as "<bed> is not
  // vacant", which sends staff hunting for a bed problem that isn't there.
  // Re-submitting is idempotent rather than an error, but the caller has to be
  // able to tell nothing was created, or the UI reports an admission that
  // doesn't exist.
  //
  // Matched on the patient, not only the visit: the same person reaching this
  // twice — a second visit, or a direct admission for someone already on a
  // ward — must not end up occupying two beds and accruing two bills.
  const existing = doc.admissions.find(
    (item) =>
      item.status === "Admitted" &&
      ((identity.visitId && item.visitId === identity.visitId) || (identity.patientId && item.patientId === identity.patientId))
  );
  if (existing) return { admission: existing, alreadyAdmitted: true };

  const bed = doc.beds.find((item) => item.id === normalizeText(input.bedId));
  if (!bed) return { error: "Bed not found." };
  if (bed.status !== "Vacant") return { error: `${bed.label} is not vacant.` };

  const now = new Date().toISOString();
  const admission: IpdAdmission = {
    id: generateId("IPD"),
    // Derived from the numbers in this same freshly-loaded document and
    // written back before it is released, so the only way to collide is the
    // whole-document write race document-store.ts already documents as
    // accepted at a single branch's volumes.
    admissionNo: nextSerialNumber("IPD", doc.admissions.map((item) => item.admissionNo)),
    createdAt: now,
    updatedAt: now,
    status: "Admitted",
    ...identity,
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
    dischargeSummary: "",
    // Track 0.7: validated required at the route (ipdAdmissionCreateSchema),
    // so reaching here means it was confirmed.
    consentRecorded: true,
    consentRecordedAt: now
  };

  setBedStatus(bed, "Occupied");
  doc.admissions.unshift(admission);
  await store.save(doc);
  return { admission };
}

export async function createBed(input: { ward: HospitalWard; label: string; dailyRate: number; notes?: string }) {
  const doc = await store.load();
  const label = normalizeText(input.label);
  if (!label) return { error: "Bed label is required." };

  const bed: HospitalBed = {
    id: generateId("BED"),
    ward: input.ward,
    label,
    status: "Vacant",
    dailyRate: normalizeNumber(input.dailyRate),
    notes: normalizeText(input.notes) || undefined
  };
  doc.beds.push(bed);
  await store.save(doc);
  return { bed };
}

export async function deleteBed(id: string) {
  const doc = await store.load();
  const bed = doc.beds.find((item) => item.id === id);
  if (!bed) return { error: "Bed not found." };

  // Ground-truth check against admissions, not bed.status — a bed's status
  // field could in principle drift from whether a patient is actually in it;
  // this is the one check that must never be wrong.
  const hasActiveAdmission = doc.admissions.some((admission) => admission.bedId === id && admission.status === "Admitted");
  if (hasActiveAdmission) return { error: "Cannot remove a bed with an active admission. Discharge or transfer the patient first." };

  doc.beds = doc.beds.filter((item) => item.id !== id);
  await store.save(doc);
  return { bed };
}

export async function updateBed(input: { id: string; status?: BedStatus; notes?: string }) {
  const doc = await store.load();
  const bed = doc.beds.find((item) => item.id === input.id);
  if (!bed) return null;
  if (input.status) setBedStatus(bed, input.status);
  if (typeof input.notes === "string") bed.notes = input.notes.trim();
  await store.save(doc);
  return bed;
}

export async function updateIpdAdmission(input: {
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
  const doc = await store.load();
  const admission = doc.admissions.find((item) => item.id === input.id);
  if (!admission) return null;

  if (input.bedId && input.bedId !== admission.bedId && admission.status === "Admitted") {
    const nextBed = doc.beds.find((bed) => bed.id === input.bedId);
    if (!nextBed || nextBed.status !== "Vacant") return null;
    const oldBed = doc.beds.find((bed) => bed.id === admission.bedId);
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
      const bed = doc.beds.find((item) => item.id === admission.bedId);
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

  await store.save(doc);
  return admission;
}
