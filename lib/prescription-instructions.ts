import type { OpdVisit, PrescriptionItem } from "@/lib/opd-types";

/**
 * Curated dosage-frequency shorthand for the prescription pad's medicine
 * table — matches the hospital's real printed pad, English label plus the
 * Hindi a patient/caregiver actually reads at home. This is patient-facing
 * print content, not staff-UI localization (the Doctor Portal itself stays
 * English — see docs/build-roadmap.md Track 4.8).
 */
export type PrescriptionInstructionPreset = {
  id: string;
  label: string;
  hindi: string;
};

export const prescriptionInstructionPresets: PrescriptionInstructionPreset[] = [
  { id: "bd", label: "BD (Morning and Evening)", hindi: "सुबह और शाम" },
  { id: "half-bd", label: "HALF BD (Morning and Evening)", hindi: "आधी गोली सुबह और शाम" },
  { id: "od-breakfast", label: "OD (Before Breakfast)", hindi: "सुबह खाली पेट" },
  { id: "od-daily", label: "OD Daily once", hindi: "रोज एक" },
  { id: "half-sos", label: "HALF SOS", hindi: "आधी गोली जरुरत पड़ने पर" },
  { id: "sos", label: "SOS", hindi: "गोली जरुरत पड़ने पर" }
];

const presetById = new Map(prescriptionInstructionPresets.map((preset) => [preset.id, preset]));

/** Resolves a stored instruction (a preset id, or free-typed text for anything the preset list doesn't cover) into what should actually be printed. */
export function resolveInstructionText(instruction: string): { label: string; hindi?: string } {
  const preset = presetById.get(instruction);
  return preset ? { label: preset.label, hindi: preset.hindi } : { label: instruction };
}

/** One line per medicine, in the same order the doctor entered them. */
export function serializePrescriptionItems(items: PrescriptionItem[]) {
  return items
    .map((item) => {
      const instruction = resolveInstructionText(item.instruction);
      const parts = [item.medicine, item.strength].filter(Boolean).join(" ");
      const days = item.days ? `${item.days} day${item.days === "1" ? "" : "s"}` : "";
      return [parts, instruction.label, days].filter(Boolean).join(" — ");
    })
    .join("\n");
}

/**
 * The one piece of text every non-Doctor-Portal consumer (AI context, patient
 * portal, admin oversight, exports, clinical timeline) should read instead of
 * visit.prescription directly — folds the structured medicine rows in ahead
 * of the free-text notes so nothing built before prescriptionItems existed
 * silently only sees the notes half of a prescription.
 */
export function prescriptionSummaryText(visit: Pick<OpdVisit, "prescription" | "prescriptionItems">): string {
  const hasItems = Boolean(visit.prescriptionItems?.length);
  const itemsText = hasItems ? serializePrescriptionItems(visit.prescriptionItems!) : "";
  const notes = visit.prescription?.trim() ?? "";
  if (hasItems && notes) return `${itemsText}\n\n${notes}`;
  return itemsText || notes;
}
