"use client";

import { Copy, FileDown, FileText, History, Printer, Send, Stamp, X } from "lucide-react";
import { useRef, useState } from "react";
import type { OpdVisit, OpdVisitStatus, PrescriptionItem } from "@/lib/opd-types";
import type { PatientRecord } from "@/lib/patient-types";
import { ActionButton } from "@/components/design-system/ActionButton";
import { AiMedicalCertificateDraft } from "@/components/opd/AiMedicalCertificateDraft";
import { AiReferralLetterDraft } from "@/components/opd/AiReferralLetterDraft";
import { AiVisitAssistant } from "@/components/opd/AiVisitAssistant";
import { AiPatientSummaryPanel } from "@/components/doctor-portal/AiPatientSummaryPanel";
import { AllergyGuard } from "@/components/doctor-portal/AllergyGuard";
import { DiagnosisField } from "@/components/doctor-portal/DiagnosisField";
import { FormField } from "@/components/design-system/FormField";
import { IdentityGuard } from "@/components/doctor-portal/IdentityGuard";
import { PrescriptionField } from "@/components/doctor-portal/PrescriptionField";
import { RecallAlert, type PatientRecallAlert } from "@/components/doctor-portal/RecallAlert";
import { RecentLabsStrip } from "@/components/doctor-portal/RecentLabsStrip";
import { inputClass, textareaClass } from "@/components/doctor-portal/shared-styles";
import { useDraftRecovery } from "@/hooks/useDraftRecovery";

/** Shown above a field whose typing was recovered from before a crash/closed tab — see hooks/useDraftRecovery. */
function DraftRestoredNotice({ onDiscard }: { onDiscard: () => void }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2 rounded border border-amber-300 bg-amber-50 dark:bg-amber-950 px-2.5 py-1.5 text-xs">
      <span className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
        <History size={13} className="shrink-0" /> Recovered unsaved text from before — review and save, or discard it.
      </span>
      <button type="button" onClick={onDiscard} className="inline-flex shrink-0 items-center gap-1 font-bold text-amber-700 hover:text-amber-900">
        <X size={12} /> Discard
      </button>
    </div>
  );
}

export function DoctorConsultationCard({
  visit,
  patient,
  updateVisit,
  copySummary,
  printSummary,
  favouriteDiagnoses,
  favouritePrescriptions,
  favouritePrescriptionItems,
  recall
}: {
  visit: OpdVisit;
  patient?: PatientRecord;
  updateVisit: (
    id: string,
    updates: Partial<
      Pick<
        OpdVisit,
        | "status"
        | "presentingComplaints"
        | "history"
        | "vitalsBp"
        | "vitalsPulse"
        | "vitalsWeight"
        | "generalExamination"
        | "perAbdomen"
        | "priorInvestigation"
        | "clinicalNote"
        | "diagnosis"
        | "investigationAdvice"
        | "prescription"
        | "prescriptionItems"
        | "advice"
        | "followUpDate"
        | "referralTo"
        | "referralLetter"
        | "certificateNote"
      >
    >
  ) => Promise<boolean>;
  copySummary: (visit: OpdVisit, patient?: PatientRecord) => Promise<void>;
  printSummary: (visit: OpdVisit, patient?: PatientRecord) => void;
  favouriteDiagnoses: string[];
  favouritePrescriptions: string[];
  favouritePrescriptionItems: PrescriptionItem[];
  recall?: PatientRecallAlert;
}) {
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const presentingComplaintsRef = useRef<HTMLTextAreaElement>(null);
  const presentingComplaintsDraft = useDraftRecovery(presentingComplaintsRef, `${visit.id}:presentingComplaints`, visit.presentingComplaints ?? "");
  const historyRef = useRef<HTMLTextAreaElement>(null);
  const historyDraft = useDraftRecovery(historyRef, `${visit.id}:history`, visit.history ?? "");
  const generalExaminationRef = useRef<HTMLTextAreaElement>(null);
  const generalExaminationDraft = useDraftRecovery(generalExaminationRef, `${visit.id}:generalExamination`, visit.generalExamination ?? "");
  const perAbdomenRef = useRef<HTMLTextAreaElement>(null);
  const perAbdomenDraft = useDraftRecovery(perAbdomenRef, `${visit.id}:perAbdomen`, visit.perAbdomen ?? "");
  const priorInvestigationRef = useRef<HTMLTextAreaElement>(null);
  const priorInvestigationDraft = useDraftRecovery(priorInvestigationRef, `${visit.id}:priorInvestigation`, visit.priorInvestigation ?? "");
  const investigationAdviceRef = useRef<HTMLTextAreaElement>(null);
  const investigationAdviceDraft = useDraftRecovery(investigationAdviceRef, `${visit.id}:investigationAdvice`, visit.investigationAdvice ?? "");
  const clinicalNoteRef = useRef<HTMLTextAreaElement>(null);
  const clinicalNoteDraft = useDraftRecovery(clinicalNoteRef, `${visit.id}:clinicalNote`, visit.clinicalNote ?? "");
  const adviceRef = useRef<HTMLTextAreaElement>(null);
  const adviceDraft = useDraftRecovery(adviceRef, `${visit.id}:advice`, visit.advice ?? "");
  const referralLetterRef = useRef<HTMLTextAreaElement>(null);
  const referralLetterDraft = useDraftRecovery(referralLetterRef, `${visit.id}:referralLetter`, visit.referralLetter ?? "");
  const certificateNoteRef = useRef<HTMLTextAreaElement>(null);
  const certificateNoteDraft = useDraftRecovery(certificateNoteRef, `${visit.id}:certificateNote`, visit.certificateNote ?? "");

  return (
    <article className="rounded border border-line/80 bg-white shadow-sm">
      <div className="border-b border-line bg-[linear-gradient(135deg,#ffffff,#ecfeff)] p-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">{visit.token} | {visit.status}</p>
            <h2 className="mt-2 text-2xl font-bold leading-tight text-ink">{visit.patientName}</h2>
            <p className="mt-2 text-sm font-semibold text-muted">{visit.service} | {visit.phone}{visit.uhid ? ` | ${visit.uhid}` : ""}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 md:min-w-[440px]">
            <ActionButton variant="primary" onClick={() => void updateVisit(visit.id, { status: "In Consultation" })}>Start</ActionButton>
            <ActionButton variant="success" onClick={() => void updateVisit(visit.id, { status: "Completed" })}>Complete</ActionButton>
            <select aria-label="Visit status"
              value={visit.status}
              onChange={(event) => void updateVisit(visit.id, { status: event.target.value as OpdVisitStatus })}
              className="rounded border border-line bg-white px-3 py-2 font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            >
              {["Waiting", "In Consultation", "Completed", "Cancelled"].map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded border border-line bg-soft/60 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Patient Context</p>
            <div className="mt-3 grid gap-2 text-sm text-muted">
              <p><span className="font-bold text-ink">Age/Gender:</span> {[patient?.age, patient?.gender].filter(Boolean).join(" / ") || "-"}</p>
              <p><span className="font-bold text-ink">Blood:</span> {patient?.bloodGroup || "-"}</p>
              <p><span className="font-bold text-ink">Emergency:</span> {patient?.emergencyContact || "-"}</p>
            </div>
          </div>
          <div className="rounded border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-red-700">Allergies</p>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-red-800">{patient?.allergies || "No allergy note recorded."}</p>
          </div>
          <div className="rounded border border-line bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">History / Medicines</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">{patient?.chronicConditions || patient?.currentMedicines || "No chronic history or medicine note recorded."}</p>
          </div>
        </div>

        {visit.symptoms.length ? (
          <div className="flex flex-wrap gap-2">
            {visit.symptoms.map((symptom) => (
              <span key={symptom} className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-teal-dark">{symptom}</span>
            ))}
          </div>
        ) : null}

        <RecentLabsStrip phone={visit.phone} />

        <AiPatientSummaryPanel phone={visit.phone} />

        <AiVisitAssistant key={`${visit.id}-assistant`} visitId={visit.id} />

        <RecallAlert recall={recall} />

        <AllergyGuard key={visit.id} visitId={visit.id} allergies={patient?.allergies} />

        <IdentityGuard
          visitId={visit.id}
          name={visit.patientName}
          phone={visit.phone}
          age={patient?.age}
          onConfirmed={() => setIdentityConfirmed(true)}
        />

        <div className="grid gap-4 rounded border border-line bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Clinical Examination</p>
          <div className="grid gap-4 lg:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-bold text-ink">Presenting Complaints</span>
              {presentingComplaintsDraft.restored ? <DraftRestoredNotice onDiscard={presentingComplaintsDraft.discard} /> : null}
              <textarea
                ref={presentingComplaintsRef}
                defaultValue={visit.presentingComplaints}
                onInput={presentingComplaintsDraft.onInput}
                onBlur={async (event) => {
                  if (await updateVisit(visit.id, { presentingComplaints: event.target.value })) presentingComplaintsDraft.onCommit();
                }}
                disabled={!identityConfirmed}
                className={textareaClass}
                placeholder="As narrated by the patient"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold text-ink">History</span>
              {historyDraft.restored ? <DraftRestoredNotice onDiscard={historyDraft.discard} /> : null}
              <textarea
                ref={historyRef}
                defaultValue={visit.history}
                onInput={historyDraft.onInput}
                onBlur={async (event) => {
                  if (await updateVisit(visit.id, { history: event.target.value })) historyDraft.onCommit();
                }}
                disabled={!identityConfirmed}
                className={textareaClass}
                placeholder="Relevant past / family history"
              />
            </label>
          </div>

          <div>
            <span className="mb-2 block text-sm font-bold text-ink">Vitals</span>
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label="BP" htmlFor="visit-vitals-bp">
                <input
                  id="visit-vitals-bp"
                  defaultValue={visit.vitalsBp}
                  onBlur={(event) => void updateVisit(visit.id, { vitalsBp: event.target.value })}
                  disabled={!identityConfirmed}
                  className={inputClass}
                  placeholder="e.g. 120/80"
                />
              </FormField>
              <FormField label="Pulse" htmlFor="visit-vitals-pulse">
                <input
                  id="visit-vitals-pulse"
                  defaultValue={visit.vitalsPulse}
                  onBlur={(event) => void updateVisit(visit.id, { vitalsPulse: event.target.value })}
                  disabled={!identityConfirmed}
                  className={inputClass}
                  placeholder="e.g. 78/min"
                />
              </FormField>
              <FormField label="Weight" htmlFor="visit-vitals-weight">
                <input
                  id="visit-vitals-weight"
                  defaultValue={visit.vitalsWeight}
                  onBlur={(event) => void updateVisit(visit.id, { vitalsWeight: event.target.value })}
                  disabled={!identityConfirmed}
                  className={inputClass}
                  placeholder="e.g. 62 kg"
                />
              </FormField>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-bold text-ink">General Examination</span>
              {generalExaminationDraft.restored ? <DraftRestoredNotice onDiscard={generalExaminationDraft.discard} /> : null}
              <textarea
                ref={generalExaminationRef}
                defaultValue={visit.generalExamination}
                onInput={generalExaminationDraft.onInput}
                onBlur={async (event) => {
                  if (await updateVisit(visit.id, { generalExamination: event.target.value })) generalExaminationDraft.onCommit();
                }}
                disabled={!identityConfirmed}
                className={textareaClass}
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold text-ink">Per Abdomen</span>
              {perAbdomenDraft.restored ? <DraftRestoredNotice onDiscard={perAbdomenDraft.discard} /> : null}
              <textarea
                ref={perAbdomenRef}
                defaultValue={visit.perAbdomen}
                onInput={perAbdomenDraft.onInput}
                onBlur={async (event) => {
                  if (await updateVisit(visit.id, { perAbdomen: event.target.value })) perAbdomenDraft.onCommit();
                }}
                disabled={!identityConfirmed}
                className={textareaClass}
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold text-ink">Prior Investigation</span>
              {priorInvestigationDraft.restored ? <DraftRestoredNotice onDiscard={priorInvestigationDraft.discard} /> : null}
              <textarea
                ref={priorInvestigationRef}
                defaultValue={visit.priorInvestigation}
                onInput={priorInvestigationDraft.onInput}
                onBlur={async (event) => {
                  if (await updateVisit(visit.id, { priorInvestigation: event.target.value })) priorInvestigationDraft.onCommit();
                }}
                disabled={!identityConfirmed}
                className={textareaClass}
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold text-ink">Investigation Advice</span>
              {investigationAdviceDraft.restored ? <DraftRestoredNotice onDiscard={investigationAdviceDraft.discard} /> : null}
              <textarea
                ref={investigationAdviceRef}
                defaultValue={visit.investigationAdvice}
                onInput={investigationAdviceDraft.onInput}
                onBlur={async (event) => {
                  if (await updateVisit(visit.id, { investigationAdvice: event.target.value })) investigationAdviceDraft.onCommit();
                }}
                disabled={!identityConfirmed}
                className={textareaClass}
                placeholder="Tests/investigations to get done"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-4">
            <DiagnosisField
              key={`${visit.id}-diagnosis`}
              visit={visit}
              disabled={!identityConfirmed}
              favourites={favouriteDiagnoses}
              onSave={(value) => void updateVisit(visit.id, { diagnosis: value })}
            />
            <label>
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-ink"><FileText size={16} /> Clinical Note</span>
              {clinicalNoteDraft.restored ? <DraftRestoredNotice onDiscard={clinicalNoteDraft.discard} /> : null}
              <textarea
                ref={clinicalNoteRef}
                defaultValue={visit.clinicalNote}
                onInput={clinicalNoteDraft.onInput}
                onBlur={async (event) => {
                  if (await updateVisit(visit.id, { clinicalNote: event.target.value })) clinicalNoteDraft.onCommit();
                }}
                disabled={!identityConfirmed}
                className={textareaClass}
                placeholder="History, examination, impression, procedure note"
              />
            </label>
          </div>
          <PrescriptionField
            key={visit.id}
            visit={visit}
            currentMedicines={patient?.currentMedicines}
            disabled={!identityConfirmed}
            favourites={favouritePrescriptions}
            favouriteItems={favouritePrescriptionItems}
            onSave={(value) => void updateVisit(visit.id, { prescription: value })}
            onSaveItems={(items) => void updateVisit(visit.id, { prescriptionItems: items })}
          />
          <label>
            <span className="mb-2 block text-sm font-bold text-ink">Advice / Procedure Instructions</span>
            {adviceDraft.restored ? <DraftRestoredNotice onDiscard={adviceDraft.discard} /> : null}
            <textarea
              ref={adviceRef}
              defaultValue={visit.advice}
              onInput={adviceDraft.onInput}
              onBlur={async (event) => {
                if (await updateVisit(visit.id, { advice: event.target.value })) adviceDraft.onCommit();
              }}
              disabled={!identityConfirmed}
              className={textareaClass}
              placeholder="Diet, warning signs, preparation, reports to bring"
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-bold text-ink">Follow-up Date</span>
            <input
              type="date"
              defaultValue={visit.followUpDate}
              onBlur={(event) => void updateVisit(visit.id, { followUpDate: event.target.value })}
              disabled={!identityConfirmed}
              className={inputClass}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionButton variant="secondary" className="whitespace-nowrap" onClick={() => void copySummary(visit, patient)}>
                <Copy size={16} /> Copy Summary
              </ActionButton>
              <ActionButton variant="primary" className="whitespace-nowrap" onClick={() => printSummary(visit, patient)}>
                <Printer size={16} /> Print
              </ActionButton>
              <a href={`/api/pdf/medical-certificate?visitId=${encodeURIComponent(visit.id)}`} className="inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded border border-line bg-soft px-4 font-bold text-ink hover:border-brand hover:text-brand">
                <Stamp size={16} /> Certificate
              </a>
              {visit.referralLetter?.trim() ? (
                <a href={`/api/pdf/referral-letter?visitId=${encodeURIComponent(visit.id)}`} className="inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded border border-line bg-soft px-4 font-bold text-ink hover:border-brand hover:text-brand">
                  <Send size={16} /> Referral Letter
                </a>
              ) : null}
              <a href={`/api/pdf/prescription?visitId=${encodeURIComponent(visit.id)}`} className="inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded border border-emerald-300/20 bg-[linear-gradient(135deg,#10b981,#047857)] px-4 font-bold text-white shadow-[0_14px_30px_rgba(16,185,129,0.22)]">
                <FileDown size={16} /> Download PDF
              </a>
            </div>
          </label>
          <label>
            <span className="mb-2 block text-sm font-bold text-ink">Referred To</span>
            <input
              type="text"
              defaultValue={visit.referralTo}
              onBlur={(event) => void updateVisit(visit.id, { referralTo: event.target.value })}
              disabled={!identityConfirmed}
              className={inputClass}
              placeholder="Specialist name, department or facility"
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-bold text-ink">Referral Letter</span>
            {referralLetterDraft.restored ? <DraftRestoredNotice onDiscard={referralLetterDraft.discard} /> : null}
            <textarea
              key={visit.referralLetter}
              ref={referralLetterRef}
              defaultValue={visit.referralLetter}
              onInput={referralLetterDraft.onInput}
              onBlur={async (event) => {
                if (await updateVisit(visit.id, { referralLetter: event.target.value })) referralLetterDraft.onCommit();
              }}
              disabled={!identityConfirmed}
              className={textareaClass}
              placeholder="Reason for referral and relevant findings"
            />
            <AiReferralLetterDraft
              visitId={visit.id}
              referredTo={visit.referralTo}
              onUseDraft={(draft) => void updateVisit(visit.id, { referralLetter: draft })}
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-bold text-ink">Certificate Note</span>
            {certificateNoteDraft.restored ? <DraftRestoredNotice onDiscard={certificateNoteDraft.discard} /> : null}
            <textarea
              key={visit.certificateNote}
              ref={certificateNoteRef}
              defaultValue={visit.certificateNote}
              onInput={certificateNoteDraft.onInput}
              onBlur={async (event) => {
                if (await updateVisit(visit.id, { certificateNote: event.target.value })) certificateNoteDraft.onCommit();
              }}
              disabled={!identityConfirmed}
              className={textareaClass}
              placeholder="Optional custom wording for the medical certificate — leave blank to use the default findings/advice text"
            />
            <AiMedicalCertificateDraft
              visitId={visit.id}
              onUseDraft={(draft) => void updateVisit(visit.id, { certificateNote: draft })}
            />
          </label>
        </div>
      </div>
    </article>
  );
}
