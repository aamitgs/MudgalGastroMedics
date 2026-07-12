"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HosFormField } from "@/components/hospital-os/HosFormField";
import { useAdvancedForm } from "@/hooks/useAdvancedForm";
import { appointmentSchema, type AppointmentInput } from "@/lib/validation/hospital-os";
import { bookHospitalAppointment } from "@/app/mudgalgastromedics-os/actions";
import { useHospitalOsStore } from "@/stores/hospital-os-store";
import type { AuditTrailItem } from "@/lib/hospital-os-data";

export function AppointmentBookingForm({ onAuditEvent }: { onAuditEvent: (item: Omit<AuditTrailItem, "recordedAt">) => void }) {
  const markAppointmentBooked = useHospitalOsStore((state) => state.markAppointmentBooked);
  const flowStatus = useHospitalOsStore((state) => state.flowStatus.appointment);
  const [auditId, setAuditId] = useState("");

  const {
    register,
    formState: { errors, isSubmitting },
    setError,
    submit
  } = useAdvancedForm<AppointmentInput>({
    schema: appointmentSchema,
    defaultValues: {
      patientUhid: "MGM-24018",
      doctor: "Dr. Deepak Sharma",
      department: "Gastroenterology",
      appointmentDate: "2026-07-01",
      appointmentTime: "15:20",
      reason: "ERCP follow-up"
    },
    async onValid(values) {
      const result = await bookHospitalAppointment(values);
      if (!result.ok) {
        Object.entries(result.fieldErrors ?? {}).forEach(([name, message]) => setError(name as keyof AppointmentInput, { message }));
        return;
      }
      markAppointmentBooked();
      setAuditId(result.auditId ?? "");
      if (result.auditId) {
        onAuditEvent({
          id: result.auditId,
          action: "hospital_os.appointment.booked",
          entityType: "appointment",
          entityId: values.patientUhid
        });
      }
    }
  });

  return (
    <Card className="rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
      <CardHeader>
        <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">Scheduling</p>
        <CardTitle className="text-xl">Appointment booking</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={submit} noValidate>
          <HosFormField label="Patient UHID" error={errors.patientUhid?.message}><Input {...register("patientUhid")} aria-label="Patient UHID" /></HosFormField>
          <HosFormField label="Doctor" error={errors.doctor?.message}><Input {...register("doctor")} aria-label="Doctor" /></HosFormField>
          <HosFormField label="Department" error={errors.department?.message}><Input {...register("department")} aria-label="Department" /></HosFormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <HosFormField label="Date" error={errors.appointmentDate?.message}><Input {...register("appointmentDate")} aria-label="Appointment date" type="date" /></HosFormField>
            <HosFormField label="Time" error={errors.appointmentTime?.message}><Input {...register("appointmentTime")} aria-label="Appointment time" type="time" /></HosFormField>
          </div>
          <HosFormField label="Reason" error={errors.reason?.message}><Textarea {...register("reason")} aria-label="Appointment reason" /></HosFormField>
          <Button type="submit" disabled={isSubmitting} className="bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]/90"><CalendarClock size={16} /> {isSubmitting ? "Booking..." : "Book Appointment"}</Button>
          {flowStatus === "booked" ? <p role="status" className="text-sm font-semibold text-[var(--hos-success)]">Appointment booked. {auditId ? `Audit ${auditId}.` : ""}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
