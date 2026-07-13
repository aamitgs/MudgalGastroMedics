"use client";

import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HosFormField } from "@/components/hospital-os/HosFormField";
import { PrintIdCardDialog } from "@/components/patients/PrintIdCardDialog";
import type { PatientRecord } from "@/lib/patient-types";

type PatientsResponse = { ok: boolean; patients?: PatientRecord[]; error?: string };

/**
 * Self-contained: owns its own search + print dialog state rather than
 * lifting it into HospitalOsApp, so wiring this previously-inert dashboard
 * button doesn't need to touch the monolith's already-decomposed prop chain.
 * Reuses the site-token PrintIdCardDialog as-is (not a hos-token duplicate) —
 * the hos-token vs site-token split is a documented "converge, don't extend" debt.
 */
export function WristbandQrButton() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientRecord[]>([]);
  const [printPatient, setPrintPatient] = useState<PatientRecord | null>(null);

  useEffect(() => {
    if (!searchOpen) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ page: "0", pageSize: "8" });
      if (query.trim()) params.set("q", query.trim());
      fetch(`/api/patients?${params.toString()}`, { cache: "no-store" })
        .then((response) => response.json().catch(() => ({})))
        .then((data: PatientsResponse) => setResults(data.ok ? (data.patients ?? []) : []))
        .catch(() => setResults([]));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [searchOpen, query]);

  return (
    <>
      <Button type="button" variant="outline" className="gap-2 border-[var(--hos-border)]" onClick={() => setSearchOpen(true)}>
        <QrCode size={16} /> Wristband QR
      </Button>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Find patient</DialogTitle>
            <DialogDescription>Search by name, UHID or phone to print a wristband.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <HosFormField label="Search">
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, UHID or phone"
                className="min-h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
            </HosFormField>
            <div className="grid max-h-72 gap-1.5 overflow-auto">
              {results.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => {
                    setPrintPatient(patient);
                    setSearchOpen(false);
                  }}
                  className="rounded-lg border border-[var(--hos-border)] p-3 text-left transition hover:border-[var(--hos-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hos-primary)]"
                >
                  <p className="font-semibold">{patient.name}</p>
                  <p className="text-xs text-[var(--hos-muted-text)]">
                    {patient.uhid} · {patient.phone}
                  </p>
                </button>
              ))}
              {results.length === 0 ? <p className="text-sm text-[var(--hos-muted-text)]">No patients found.</p> : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <PrintIdCardDialog patient={printPatient} setPatient={setPrintPatient} defaultMode="wristband" />
    </>
  );
}
