"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ActionButton } from "@/components/design-system/ActionButton";
import { site } from "@/lib/site-data";
import type { PatientRecord } from "@/lib/patient-types";

type PrintMode = "card" | "wristband";

// @page size differs per mode; injected as a <style> tag at print time
// rather than declared in globals.css, since CSS named pages (@page
// cardSize {} + page: cardSize on an element) have inconsistent browser
// support. CR80 ID card size for the card; a cut-and-wrap strip for the
// wristband, since no dedicated thermal wristband printer is assumed.
const PAGE_SIZE: Record<PrintMode, string> = {
  card: "85.6mm 53.98mm",
  wristband: "180mm 32mm"
};

function IdCardMarkup({ patient, qrSvg }: { patient: PatientRecord; qrSvg: string }) {
  return (
    <div className="id-card">
      <div className="id-card-header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mgm-logo.png" alt={`${site.name} logo`} />
        <p>{site.name}</p>
      </div>
      <div className="id-card-body">
        <div className="id-card-fields">
          <p className="name">{patient.name}</p>
          <p className="uhid">{patient.uhid}</p>
          <dl>
            {patient.age || patient.gender ? (
              <>
                <dt>Age/Sex</dt>
                <dd>{[patient.age, patient.gender].filter(Boolean).join(" / ") || "—"}</dd>
              </>
            ) : null}
            {patient.bloodGroup ? (
              <>
                <dt>Blood</dt>
                <dd>{patient.bloodGroup}</dd>
              </>
            ) : null}
            <dt>Phone</dt>
            <dd>{patient.phone}</dd>
          </dl>
          {patient.allergies ? <p className="allergy-flag">Allergy: {patient.allergies}</p> : null}
        </div>
        {qrSvg ? <div className="id-card-qr" dangerouslySetInnerHTML={{ __html: qrSvg }} /> : null}
      </div>
    </div>
  );
}

function WristbandMarkup({ patient, qrSvg }: { patient: PatientRecord; qrSvg: string }) {
  return (
    <div className="wristband">
      {qrSvg ? <div className="wristband-qr" dangerouslySetInnerHTML={{ __html: qrSvg }} /> : null}
      <div className="wristband-fields">
        <p className="name">{patient.name}</p>
        <p className="meta">
          {patient.uhid}
          {patient.age || patient.gender ? ` · ${[patient.age, patient.gender].filter(Boolean).join("/")}` : ""}
          {patient.bloodGroup ? ` · ${patient.bloodGroup}` : ""}
        </p>
        {patient.allergies ? <p className="allergy-flag">Allergy: {patient.allergies}</p> : null}
      </div>
    </div>
  );
}

export function PrintIdCardDialog({
  patient,
  setPatient,
  defaultMode = "card"
}: {
  patient: PatientRecord | null;
  setPatient: (patient: PatientRecord | null) => void;
  defaultMode?: PrintMode;
}) {
  const [mode, setMode] = useState<PrintMode>(defaultMode);
  const [qrSvg, setQrSvg] = useState("");

  useEffect(() => {
    // No reset-to-empty branch when patient is null: qrSvg isn't rendered
    // anywhere until a patient is selected again, so a briefly-stale value
    // between patients is never actually shown — and resetting it here would
    // be a synchronous setState at the top of the effect body.
    if (!patient) return;
    let cancelled = false;
    QRCode.toString(patient.uhid, { type: "svg", margin: 0, color: { dark: "#102f39", light: "#ffffff00" } })
      .then((svg) => {
        if (!cancelled) setQrSvg(svg);
      })
      .catch(() => {
        if (!cancelled) setQrSvg("");
      });
    return () => {
      cancelled = true;
    };
  }, [patient]);

  function print() {
    const style = document.createElement("style");
    style.textContent = `@page { size: ${PAGE_SIZE[mode]}; margin: 0; }`;
    document.head.appendChild(style);
    window.setTimeout(() => {
      window.print();
      style.remove();
    }, 50);
  }

  return (
    <>
      <Dialog
        open={Boolean(patient)}
        onOpenChange={(open) => {
          if (!open) setPatient(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Print patient ID</DialogTitle>
            <DialogDescription>{patient ? `${patient.name} — ${patient.uhid}` : "Print an ID card or wristband."}</DialogDescription>
          </DialogHeader>
          {patient ? (
            <div className="grid gap-4">
              <div className="flex gap-2">
                <ActionButton variant={mode === "card" ? "primary" : "secondary"} onClick={() => setMode("card")} aria-pressed={mode === "card"}>
                  ID Card
                </ActionButton>
                <ActionButton variant={mode === "wristband" ? "primary" : "secondary"} onClick={() => setMode("wristband")} aria-pressed={mode === "wristband"}>
                  Wristband
                </ActionButton>
              </div>
              <div className="flex items-center justify-center overflow-auto rounded border border-line bg-soft/40 p-6">
                {mode === "card" ? <IdCardMarkup patient={patient} qrSvg={qrSvg} /> : <WristbandMarkup patient={patient} qrSvg={qrSvg} />}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setPatient(null)}>
                  Close
                </Button>
                <ActionButton variant="primary" onClick={print}>
                  <Printer size={16} /> Print {mode === "card" ? "ID Card" : "Wristband"}
                </ActionButton>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      {patient ? <div className="id-card-print">{mode === "card" ? <IdCardMarkup patient={patient} qrSvg={qrSvg} /> : <WristbandMarkup patient={patient} qrSvg={qrSvg} />}</div> : null}
    </>
  );
}
