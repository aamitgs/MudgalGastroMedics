import type { OpdVisit } from "@/lib/opd-types";
import type { PatientRecord } from "@/lib/patient-types";
import { site } from "@/lib/site-data";

export function DoctorPrintableSummary({ visit, patient }: { visit: OpdVisit; patient?: PatientRecord }) {
  return (
    <section className="patient-print">
      <div className="print-sheet">
        <header className="print-header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mgm-logo.png" alt="Mudgal Gastro Medics logo" />
          <div>
            <h1>{site.name}</h1>
            <p>{site.tagline}</p>
            <p>{site.addressLine1}, {site.addressLine2}, {site.city}, {site.region} {site.postalCode}</p>
            <p>Phone: {site.phone} | WhatsApp: {site.mobile}</p>
          </div>
        </header>
        <div className="print-title">
          <div>
            <p>Doctor Consultation Summary</p>
            <h2>{visit.patientName}</h2>
          </div>
          <div>
            <p>Token</p>
            <strong>{visit.token}</strong>
          </div>
        </div>
        <dl className="print-grid">
          {visit.uhid ? <div><dt>UHID</dt><dd>{visit.uhid}</dd></div> : null}
          <div><dt>Service</dt><dd>{visit.service}</dd></div>
          <div><dt>Phone</dt><dd>{visit.phone}</dd></div>
          <div><dt>Age / Gender</dt><dd>{[patient?.age, patient?.gender].filter(Boolean).join(" / ") || "-"}</dd></div>
          <div><dt>Status</dt><dd>{visit.status}</dd></div>
          <div><dt>Follow-up</dt><dd>{visit.followUpDate || "-"}</dd></div>
        </dl>
        {patient?.allergies ? <section className="print-block"><h3>Allergies</h3><p>{patient.allergies}</p></section> : null}
        {visit.symptoms.length ? <section className="print-block"><h3>Symptoms</h3><p>{visit.symptoms.join(", ")}</p></section> : null}
        {visit.clinicalNote ? <section className="print-block"><h3>Clinical Note</h3><p>{visit.clinicalNote}</p></section> : null}
        {visit.prescription ? <section className="print-block"><h3>Prescription</h3><p>{visit.prescription}</p></section> : null}
        {visit.advice ? <section className="print-block"><h3>Advice</h3><p>{visit.advice}</p></section> : null}
        <footer className="print-footer">
          <p>Generated from doctor portal. Final instructions should be clinician-reviewed before sharing.</p>
          <p>Printed on {new Date().toLocaleDateString("en-IN")}</p>
        </footer>
      </div>
    </section>
  );
}
