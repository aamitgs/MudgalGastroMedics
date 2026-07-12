"use client";

import { useState } from "react";
import { UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HosFormField } from "@/components/hospital-os/HosFormField";
import { useAdvancedForm } from "@/hooks/useAdvancedForm";
import { patientRegistrationSchema, type PatientRegistrationInput } from "@/lib/validation/hospital-os";
import { registerHospitalPatient } from "@/app/mudgalgastromedics-os/actions";
import { useHospitalOsStore } from "@/stores/hospital-os-store";
import type { AuditTrailItem } from "@/lib/hospital-os-data";

export function PatientRegistrationForm({ onAuditEvent }: { onAuditEvent: (item: Omit<AuditTrailItem, "recordedAt">) => void }) {
  const markPatientRegistered = useHospitalOsStore((state) => state.markPatientRegistered);
  const flowStatus = useHospitalOsStore((state) => state.flowStatus.patientRegistration);
  const [auditId, setAuditId] = useState("");

  const {
    register,
    formState: { errors, isSubmitting },
    setError,
    reset,
    submit
  } = useAdvancedForm<PatientRegistrationInput>({
    schema: patientRegistrationSchema,
    defaultValues: { firstName: "", lastName: "", mobile: "", age: 42, sex: "Male", concern: "" },
    async onValid(values) {
      const result = await registerHospitalPatient(values);
      if (!result.ok) {
        Object.entries(result.fieldErrors ?? {}).forEach(([name, message]) => setError(name as keyof PatientRegistrationInput, { message }));
        return;
      }
      markPatientRegistered({ uhid: "MGM-NEW", patient: `${values.firstName} ${values.lastName}` });
      setAuditId(result.auditId ?? "");
      if (result.auditId) {
        onAuditEvent({
          id: result.auditId,
          action: "hospital_os.patient.registered",
          entityType: "patient",
          entityId: `registration-${values.mobile.slice(-4)}`
        });
      }
      reset(values);
    }
  });

  return (
    <Card id="patient-registration" className="scroll-mt-20 rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
      <CardHeader>
        <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">Vercel-style form</p>
        <CardTitle className="text-xl">Patient registration</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={submit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <HosFormField label="First name" error={errors.firstName?.message}><Input {...register("firstName")} aria-label="First name" /></HosFormField>
            <HosFormField label="Last name" error={errors.lastName?.message}><Input {...register("lastName")} aria-label="Last name" /></HosFormField>
          </div>
          <HosFormField label="Mobile" error={errors.mobile?.message}><Input {...register("mobile")} aria-label="Mobile" inputMode="numeric" /></HosFormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <HosFormField label="Age" error={errors.age?.message}><Input {...register("age")} aria-label="Age" type="number" /></HosFormField>
            <HosFormField label="Sex" error={errors.sex?.message}>
              <select {...register("sex")} aria-label="Sex" className="min-h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </HosFormField>
          </div>
          <HosFormField label="Concern" error={errors.concern?.message}><Textarea {...register("concern")} aria-label="Concern" /></HosFormField>
          <Button type="submit" disabled={isSubmitting} className="bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]/90"><UserRoundPlus size={16} /> {isSubmitting ? "Saving..." : "Register Patient"}</Button>
          {flowStatus === "saved" ? <p role="status" className="text-sm font-semibold text-[var(--hos-success)]">Patient registration saved. {auditId ? `Audit ${auditId}.` : ""}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
