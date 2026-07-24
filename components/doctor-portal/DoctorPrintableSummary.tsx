import type { OpdVisit } from "@/lib/opd-types";
import type { PatientRecord } from "@/lib/patient-types";
import { resolveInstructionText } from "@/lib/prescription-instructions";
import { site } from "@/lib/site-data";

export function DoctorPrintableSummary({ visit, patient }: { visit: OpdVisit; patient?: PatientRecord }) {
  const hasItems = Boolean(visit.prescriptionItems?.length);
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
          {patient?.address ? <div><dt>Address</dt><dd>{patient.address}</dd></div> : null}
          <div><dt>Status</dt><dd>{visit.status}</dd></div>
          <div><dt>Follow-up</dt><dd>{visit.followUpDate || "-"}</dd></div>
        </dl>
        {patient?.allergies ? <section className="print-block"><h3>Allergies</h3><p>{patient.allergies}</p></section> : null}
        {visit.symptoms.length ? <section className="print-block"><h3>Symptoms</h3><p>{visit.symptoms.join(", ")}</p></section> : null}
        <section className="print-block">
          <table className="print-exam-table">
            <tbody>
              <tr><td>Presenting Complaints</td><td>{visit.presentingComplaints || ""}</td></tr>
              <tr><td>History</td><td>{visit.history || ""}</td></tr>
              <tr>
                <td>Vitals</td>
                <td>
                  <span className="vitals-value">
                    <span>BP: {visit.vitalsBp || ""}</span>
                    <span>Pulse: {visit.vitalsPulse || ""}</span>
                    <span>Weight: {visit.vitalsWeight || ""}</span>
                  </span>
                </td>
              </tr>
              <tr><td>General Examination</td><td>{visit.generalExamination || ""}</td></tr>
              <tr><td>Per Abdomen</td><td>{visit.perAbdomen || ""}</td></tr>
              <tr><td>Prior Investigation</td><td>{visit.priorInvestigation || ""}</td></tr>
              <tr><td>Diagnosis</td><td>{visit.diagnosis || ""}</td></tr>
              <tr><td>Advice / Procedure Instructions</td><td>{visit.investigationAdvice || ""}</td></tr>
            </tbody>
          </table>
        </section>
        {visit.clinicalNote ? <section className="print-block"><h3>Clinical Note</h3><p>{visit.clinicalNote}</p></section> : null}
        {hasItems ? (
          <section className="print-block">
            <h3>Treatment Advice (Rx)</h3>
            <table className="print-rx-table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Strength</th>
                  <th>Instruction</th>
                  <th>Days</th>
                </tr>
              </thead>
              <tbody>
                {visit.prescriptionItems!.map((item) => {
                  const instruction = resolveInstructionText(item.instruction);
                  return (
                    <tr key={item.id}>
                      <td>{item.medicine}</td>
                      <td>{item.strength || "—"}</td>
                      <td>
                        {instruction.label}
                        {instruction.hindi ? <span className="rx-hindi">{instruction.hindi}</span> : null}
                      </td>
                      <td>{item.days || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ) : null}
        {visit.prescription ? <section className="print-block"><h3>{hasItems ? "Additional Notes" : "Prescription"}</h3><p>{visit.prescription}</p></section> : null}
        {visit.advice ? <section className="print-block"><h3>Advice</h3><p>{visit.advice}</p></section> : null}
        <footer className="print-footer">
          <p>Generated from doctor portal. Final instructions should be clinician-reviewed before sharing.</p>
          <p>Printed on {new Date().toLocaleDateString("en-IN")}</p>
        </footer>
      </div>
    </section>
  );
}
