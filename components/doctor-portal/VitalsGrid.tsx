"use client";

import { AlertTriangle } from "lucide-react";
import { FormField } from "@/components/design-system/FormField";
import { inputClass } from "@/components/doctor-portal/shared-styles";
import { bmiCategory, computeBmi, flagBloodSugar, flagBp, flagPulse, flagRespiratoryRate, flagSpo2, flagTemperature, type VitalFlag } from "@/lib/clinical/vitals";
import type { OpdVisit } from "@/lib/opd-types";

export type VitalKey = "vitalsBp" | "vitalsPulse" | "vitalsWeight" | "vitalsHeight" | "vitalsRespiratoryRate" | "vitalsTemperature" | "vitalsSpo2" | "vitalsBloodSugar";

const fields: { key: VitalKey; label: string; placeholder: string; flag?: (value?: string) => VitalFlag }[] = [
  { key: "vitalsHeight", label: "Height", placeholder: "e.g. 165 cm" },
  { key: "vitalsWeight", label: "Weight", placeholder: "e.g. 62 kg" },
  { key: "vitalsBp", label: "BP", placeholder: "e.g. 120/80", flag: flagBp },
  { key: "vitalsPulse", label: "Pulse", placeholder: "e.g. 78/min", flag: flagPulse },
  { key: "vitalsRespiratoryRate", label: "Respiratory Rate", placeholder: "e.g. 16/min", flag: flagRespiratoryRate },
  { key: "vitalsTemperature", label: "Temperature", placeholder: "e.g. 98.4 F", flag: flagTemperature },
  { key: "vitalsSpo2", label: "SpO2", placeholder: "e.g. 98%", flag: flagSpo2 },
  { key: "vitalsBloodSugar", label: "Blood Sugar", placeholder: "e.g. 110 mg/dL", flag: flagBloodSugar }
];

/**
 * Reception captures these before the doctor sees the patient (Track:
 * reception vitals) — the doctor can still edit any value here. Abnormal-
 * range flags are advisory only (Part 8: warn, never block) against a
 * conservative adult-normal band, not a diagnosis; clinical judgement
 * always governs, so nothing here disables Complete or any other action.
 */
export function VitalsGrid({
  visit,
  disabled,
  onUpdate
}: {
  visit: OpdVisit;
  disabled?: boolean;
  onUpdate: (updates: Partial<Pick<OpdVisit, VitalKey>>) => void;
}) {
  const bmi = computeBmi(visit.vitalsHeight, visit.vitalsWeight);
  return (
    <div>
      <span className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-ink">Vitals</span>
        {bmi !== undefined ? (
          <span className="rounded-full border border-line bg-soft px-2.5 py-1 text-xs font-bold text-ink">BMI {bmi} · {bmiCategory(bmi)}</span>
        ) : null}
      </span>
      <div className="grid gap-3 sm:grid-cols-4">
        {fields.map((field) => {
          const value = visit[field.key];
          const flag = field.flag?.(value);
          return (
            <FormField key={field.key} label={field.label} htmlFor={`visit-${field.key}`}>
              <input
                id={`visit-${field.key}`}
                defaultValue={value}
                onBlur={(event) => onUpdate({ [field.key]: event.target.value } as Partial<Pick<OpdVisit, VitalKey>>)}
                disabled={disabled}
                className={flag ? `${inputClass} border-amber-400 focus:border-amber-500` : inputClass}
                placeholder={field.placeholder}
              />
              {flag ? (
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <AlertTriangle size={11} /> {flag === "high" ? "Above" : "Below"} typical adult range
                </p>
              ) : null}
            </FormField>
          );
        })}
      </div>
    </div>
  );
}
