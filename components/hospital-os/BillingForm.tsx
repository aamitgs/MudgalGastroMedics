"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HosFormField } from "@/components/hospital-os/HosFormField";
import { useAdvancedForm } from "@/hooks/useAdvancedForm";
import { billingSchema, type BillingInput } from "@/lib/validation/hospital-os";
import { postHospitalBilling } from "@/app/mudgalgastromedics-os/actions";
import { useHospitalOsStore } from "@/stores/hospital-os-store";
import type { AuditTrailItem } from "@/lib/hospital-os-data";

export function BillingForm({ onAuditEvent }: { onAuditEvent: (item: Omit<AuditTrailItem, "recordedAt">) => void }) {
  const markBillingPosted = useHospitalOsStore((state) => state.markBillingPosted);
  const flowStatus = useHospitalOsStore((state) => state.flowStatus.billing);
  const [auditId, setAuditId] = useState("");

  const {
    register,
    formState: { errors, isSubmitting },
    setError,
    submit
  } = useAdvancedForm<BillingInput>({
    schema: billingSchema,
    defaultValues: { invoiceId: "INV-5821", patientUhid: "MGM-24018", amount: 18450, payerType: "Insurance", notes: "Insurance review for procedure billing." },
    async onValid(values) {
      const result = await postHospitalBilling(values);
      if (!result.ok) {
        Object.entries(result.fieldErrors ?? {}).forEach(([name, message]) => setError(name as keyof BillingInput, { message }));
        return;
      }
      markBillingPosted();
      setAuditId(result.auditId ?? "");
      if (result.auditId) {
        onAuditEvent({
          id: result.auditId,
          action: "hospital_os.billing.posted",
          entityType: "invoice",
          entityId: values.invoiceId
        });
      }
    }
  });

  return (
    <Card id="billing" className="scroll-mt-20 rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
      <CardHeader>
        <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">Stripe-style billing</p>
        <CardTitle className="text-xl">Billing workflow</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={submit} noValidate>
          <HosFormField label="Invoice ID" error={errors.invoiceId?.message}><Input {...register("invoiceId")} aria-label="Invoice ID" /></HosFormField>
          <HosFormField label="Patient UHID" error={errors.patientUhid?.message}><Input {...register("patientUhid")} aria-label="Billing patient UHID" /></HosFormField>
          <HosFormField label="Amount" error={errors.amount?.message}><Input {...register("amount")} aria-label="Amount" type="number" /></HosFormField>
          <HosFormField label="Payer" error={errors.payerType?.message}>
            <select {...register("payerType")} aria-label="Payer type" className="min-h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option>Self pay</option>
              <option>Insurance</option>
              <option>Corporate</option>
            </select>
          </HosFormField>
          <HosFormField label="Notes" error={errors.notes?.message}><Textarea {...register("notes")} aria-label="Billing notes" /></HosFormField>
          <Button type="submit" disabled={isSubmitting} className="bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]/90"><CreditCard size={16} /> {isSubmitting ? "Posting..." : "Post Billing"}</Button>
          {flowStatus === "posted" ? <p role="status" className="text-sm font-semibold text-[var(--hos-success)]">Billing posted. {auditId ? `Audit ${auditId}.` : ""}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
