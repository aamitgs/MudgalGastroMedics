"use client";

import { useState, useTransition } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { HosFormField } from "@/components/hospital-os/HosFormField";
import { requestTeleconsultation } from "@/app/mudgalgastromedics-os/actions";
import type { AuditTrailItem } from "@/lib/hospital-os-data";

export function PatientPortalPanel({ onAuditEvent }: { onAuditEvent: (item: Omit<AuditTrailItem, "recordedAt">) => void }) {
  const patientPortalUhid = "MGM-24018";
  const [symptoms, setSymptoms] = useState("");
  const [symptomSummary, setSymptomSummary] = useState("");
  const [symptomError, setSymptomError] = useState("");
  const [showTeleconsult, setShowTeleconsult] = useState(false);
  const [teleconsultOpen, setTeleconsultOpen] = useState(false);
  const [teleconsultSubmitted, setTeleconsultSubmitted] = useState(false);
  const [teleconsultError, setTeleconsultError] = useState("");
  const [isTeleconsultPending, startTeleconsultTransition] = useTransition();

  function reviewSymptoms() {
    const trimmed = symptoms.trim();
    const lowerSymptoms = trimmed.toLowerCase();
    const hasRedFlag = ["severe", "bleeding", "blood", "faint", "chest pain", "vomiting", "black stool"].some((term) => lowerSymptoms.includes(term));
    if (trimmed.length < 5) {
      setSymptomError("Enter a short symptom note before reviewing.");
      setSymptomSummary("");
      setShowTeleconsult(false);
      return;
    }

    setSymptomError("");
    setShowTeleconsult(hasRedFlag);
    setSymptomSummary(hasRedFlag
      ? "Your note includes symptoms that may need urgent attention. Please contact the hospital care team now or use local emergency services if symptoms feel severe."
      : "Based on what you shared, keep tracking symptoms and contact the hospital if discomfort increases, fever appears, vomiting continues, or you feel weak.");
  }

  function submitTeleconsultationRequest() {
    setTeleconsultError("");
    startTeleconsultTransition(async () => {
      const result = await requestTeleconsultation({
        patientId: patientPortalUhid,
        symptomNote: symptoms
      });

      if (!result.ok) {
        setTeleconsultError(result.message);
        return;
      }

      if (result.auditId) {
        onAuditEvent({
          id: result.auditId,
          action: "hospital_os.teleconsultation.requested",
          entityType: "patient",
          entityId: patientPortalUhid
        });
      }
      setTeleconsultSubmitted(true);
      setTeleconsultOpen(false);
    });
  }

  return (
    <section id="patient-portal-preview" className="scroll-mt-20 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <Card className="rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
        <CardHeader>
          <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">Patient portal</p>
          <CardTitle className="text-2xl">Warm Apple Health-inspired patient view</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {["Upcoming appointment today at 3:20 PM", "LFT report summary ready", "Family member access: 2 profiles", "Teleconsultation entry point enabled"].map((item) => (
            <div key={item} className="rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-4 text-sm font-medium">{item}</div>
          ))}
        </CardContent>
      </Card>
      <Card className="rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
        <CardHeader>
          <CardTitle className="text-xl">Vitals trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[
              { day: "Mon", pulse: 78, pain: 5 },
              { day: "Tue", pulse: 82, pain: 4 },
              { day: "Wed", pulse: 80, pain: 3 },
              { day: "Thu", pulse: 76, pain: 2 }
            ]}>
              <CartesianGrid stroke="var(--hos-border)" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip />
              <Area dataKey="pulse" stroke="#2563EB" fill="#2563EB" fillOpacity={0.12} strokeWidth={2} />
              <Area dataKey="pain" stroke="#16A34A" fill="#16A34A" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)] lg:col-span-2">
        <CardHeader>
          <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">AI symptom checker</p>
          <CardTitle className="text-xl">Informational guidance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-3">
            <Textarea
              aria-label="Patient symptom note"
              value={symptoms}
              onChange={(event) => {
                setSymptoms(event.target.value);
                if (symptomError) setSymptomError("");
                if (showTeleconsult) setShowTeleconsult(false);
              }}
              placeholder="Describe symptoms, duration, and severity"
              aria-invalid={Boolean(symptomError)}
              className="min-h-24"
            />
            {symptomError ? <p role="alert" className="text-sm font-semibold text-[var(--hos-danger)]">{symptomError}</p> : null}
            <Button type="button" onClick={reviewSymptoms} className="w-fit bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]/90">Review Symptoms</Button>
          </div>
          <div className="rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-4">
            <p className="text-sm font-semibold">Not a diagnosis</p>
            <p className="mt-2 text-sm leading-6 text-[var(--hos-muted-text)]">
              {symptomSummary || "This checker provides general information only and does not replace a doctor consultation."}
            </p>
            {showTeleconsult ? (
              <Button type="button" variant="outline" onClick={() => setTeleconsultOpen(true)} className="mt-4 border-[var(--hos-border)] bg-[var(--hos-surface)]">
                Start Teleconsultation
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <Dialog
        open={teleconsultOpen}
        onOpenChange={(open) => {
          setTeleconsultOpen(open);
          if (!open) setTeleconsultError("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teleconsultation request</DialogTitle>
            <DialogDescription>
              A care team member will review this request. Use local emergency services if symptoms feel severe.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <HosFormField label="Symptom note">
              <Textarea aria-label="Teleconsultation symptom note" value={symptoms} readOnly className="min-h-24" />
            </HosFormField>
            {teleconsultError ? <p role="alert" className="text-sm font-semibold text-[var(--hos-danger)]">{teleconsultError}</p> : null}
            <Button
              type="button"
              disabled={isTeleconsultPending}
              className="w-fit bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]/90"
              onClick={submitTeleconsultationRequest}
            >
              {isTeleconsultPending ? "Requesting..." : "Request Teleconsultation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {teleconsultSubmitted ? <p role="status" className="sr-only">Teleconsultation request sent.</p> : null}
    </section>
  );
}
