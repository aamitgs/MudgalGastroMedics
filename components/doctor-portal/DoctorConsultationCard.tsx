"use client";

import { Copy, FileText, Printer } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { OpdVisit, PrescriptionItem } from "@/lib/opd-types";
import type { PatientRecord } from "@/lib/patient-types";
import { ActionButton } from "@/components/design-system/ActionButton";
import { AiMedicalCertificateDraft } from "@/components/opd/AiMedicalCertificateDraft";
import { AiReferralLetterDraft } from "@/components/opd/AiReferralLetterDraft";
import { AiVisitAssistant } from "@/components/opd/AiVisitAssistant";
import { AiPatientSummaryPanel } from "@/components/doctor-portal/AiPatientSummaryPanel";
import { AllergyGuard } from "@/components/doctor-portal/AllergyGuard";
import { ClinicalDecisionSupportPanel } from "@/components/doctor-portal/ClinicalDecisionSupportPanel";
import { ClinicalTemplateMenu } from "@/components/doctor-portal/ClinicalTemplateMenu";
import { ConsultationChecklist } from "@/components/doctor-portal/ConsultationChecklist";
import { ConsultationShortcutsDialog } from "@/components/doctor-portal/ConsultationShortcutsDialog";
import { ConsultationStickyHeader } from "@/components/doctor-portal/ConsultationStickyHeader";
import { DiagnosisField } from "@/components/doctor-portal/DiagnosisField";
import { DraftRestoredNotice } from "@/components/design-system/DraftRestoredNotice";
import { FavouriteChips } from "@/components/doctor-portal/FavouriteChips";
import { FollowUpQuickPicks } from "@/components/doctor-portal/FollowUpQuickPicks";
import { Icd10CodePicker } from "@/components/doctor-portal/Icd10CodePicker";
import { IdentityGuard } from "@/components/doctor-portal/IdentityGuard";
import { PatientEducationMenu } from "@/components/doctor-portal/PatientEducationMenu";
import { PdfPreviewButton } from "@/components/design-system/PdfPreviewButton";
import { PrescriptionField } from "@/components/doctor-portal/PrescriptionField";
import { PreviousVisitHistory } from "@/components/doctor-portal/PreviousVisitHistory";
import { TimelineComparisonPanel } from "@/components/doctor-portal/TimelineComparisonPanel";
import { generalExaminationChips, perAbdomenChips, QuickExamChips } from "@/components/doctor-portal/QuickExamChips";
import { RecallAlert, type PatientRecallAlert } from "@/components/doctor-portal/RecallAlert";
import { RecentLabsStrip } from "@/components/doctor-portal/RecentLabsStrip";
import { SaveStatusIndicator } from "@/components/doctor-portal/SaveStatusIndicator";
import { VitalsGrid } from "@/components/doctor-portal/VitalsGrid";
import { VoiceDictationButton } from "@/components/doctor-portal/VoiceDictationButton";
import { inputClass, textareaClass } from "@/components/doctor-portal/shared-styles";
import { useConsultationShortcuts } from "@/hooks/useConsultationShortcuts";
import { useDraftRecovery, type AutosaveState } from "@/hooks/useDraftRecovery";
import { evaluateDecisionSupport, type CdsRecommendation } from "@/lib/clinical/decision-support";
import { notify } from "@/lib/notify";
import type { ClinicalTemplate } from "@/lib/clinical-template-types";

export function DoctorConsultationCard({
  visit,
  patient,
  updateVisit,
  copySummary,
  printSummary,
  favouriteDiagnoses,
  favouriteInvestigations,
  favouritePrescriptions,
  favouritePrescriptionItems,
  pastVisits,
  recall
}: {
  visit: OpdVisit;
  patient?: PatientRecord;
  /** Prior visits for the same patient — feeds the CDS engine's cross-visit rules (long-term medication, screening history, recall). */
  pastVisits: OpdVisit[];
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
        | "vitalsHeight"
        | "vitalsRespiratoryRate"
        | "vitalsTemperature"
        | "vitalsSpo2"
        | "vitalsBloodSugar"
        | "generalExamination"
        | "perAbdomen"
        | "priorInvestigation"
        | "clinicalNote"
        | "diagnosis"
        | "diagnosisIcd10Code"
        | "diagnosisIcd10Label"
        | "investigationAdvice"
        | "prescription"
        | "prescriptionItems"
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
  favouriteInvestigations: string[];
  favouritePrescriptions: string[];
  favouritePrescriptionItems: PrescriptionItem[];
  recall?: PatientRecallAlert;
}) {
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const presentingComplaintsRef = useRef<HTMLTextAreaElement>(null);
  const presentingComplaintsDraft = useDraftRecovery(presentingComplaintsRef, `${visit.id}:presentingComplaints`, visit.presentingComplaints ?? "", (value) => updateVisit(visit.id, { presentingComplaints: value }));
  const historyRef = useRef<HTMLTextAreaElement>(null);
  const historyDraft = useDraftRecovery(historyRef, `${visit.id}:history`, visit.history ?? "", (value) => updateVisit(visit.id, { history: value }));
  const generalExaminationRef = useRef<HTMLTextAreaElement>(null);
  const generalExaminationDraft = useDraftRecovery(generalExaminationRef, `${visit.id}:generalExamination`, visit.generalExamination ?? "", (value) => updateVisit(visit.id, { generalExamination: value }));
  const perAbdomenRef = useRef<HTMLTextAreaElement>(null);
  const perAbdomenDraft = useDraftRecovery(perAbdomenRef, `${visit.id}:perAbdomen`, visit.perAbdomen ?? "", (value) => updateVisit(visit.id, { perAbdomen: value }));
  const priorInvestigationRef = useRef<HTMLTextAreaElement>(null);
  const priorInvestigationDraft = useDraftRecovery(priorInvestigationRef, `${visit.id}:priorInvestigation`, visit.priorInvestigation ?? "", (value) => updateVisit(visit.id, { priorInvestigation: value }));
  const investigationAdviceRef = useRef<HTMLTextAreaElement>(null);
  const investigationAdviceDraft = useDraftRecovery(investigationAdviceRef, `${visit.id}:investigationAdvice`, visit.investigationAdvice ?? "", (value) => updateVisit(visit.id, { investigationAdvice: value }));
  const clinicalNoteRef = useRef<HTMLTextAreaElement>(null);
  const clinicalNoteDraft = useDraftRecovery(clinicalNoteRef, `${visit.id}:clinicalNote`, visit.clinicalNote ?? "", (value) => updateVisit(visit.id, { clinicalNote: value }));
  const referralLetterRef = useRef<HTMLTextAreaElement>(null);
  const referralLetterDraft = useDraftRecovery(referralLetterRef, `${visit.id}:referralLetter`, visit.referralLetter ?? "", (value) => updateVisit(visit.id, { referralLetter: value }));
  const certificateNoteRef = useRef<HTMLTextAreaElement>(null);
  const certificateNoteDraft = useDraftRecovery(certificateNoteRef, `${visit.id}:certificateNote`, visit.certificateNote ?? "", (value) => updateVisit(visit.id, { certificateNote: value }));
  const followUpDateRef = useRef<HTMLInputElement>(null);
  // The investigation-advice field is an uncontrolled textarea, so its blank/
  // filled state (which drives whether the frequently-used chips show, mirroring
  // the controlled Diagnosis/Prescription fields) is tracked separately.
  const [investigationAdviceEmpty, setInvestigationAdviceEmpty] = useState(!visit.investigationAdvice?.trim());
  const [diagnosisApply, setDiagnosisApply] = useState<{ value: string; nonce: number }>();
  const [diagnosisSaveState, setDiagnosisSaveState] = useState<AutosaveState>("idle");
  const [prescriptionSaveState, setPrescriptionSaveState] = useState<AutosaveState>("idle");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // One honest status for the sticky header, folded from every field's own
  // indicator — Diagnosis and Prescription notes report in via
  // onSaveStateChange since their autosave state is otherwise private to
  // those components. The Rx table's own row edits commit immediately (no
  // debounce, no separate state to fold in) and already toast on failure.
  const allSaveStates: AutosaveState[] = [
    presentingComplaintsDraft.saveState,
    historyDraft.saveState,
    generalExaminationDraft.saveState,
    perAbdomenDraft.saveState,
    priorInvestigationDraft.saveState,
    investigationAdviceDraft.saveState,
    clinicalNoteDraft.saveState,
    referralLetterDraft.saveState,
    certificateNoteDraft.saveState,
    diagnosisSaveState,
    prescriptionSaveState
  ];
  const aggregateSaveState: AutosaveState = allSaveStates.includes("saving")
    ? "saving"
    : allSaveStates.includes("pending")
      ? "pending"
      : allSaveStates.includes("saved")
        ? "saved"
        : "idle";

  // Native "leave site?" confirmation while a debounced save hasn't landed
  // yet — Part 8/Track 4.2's "never silently lose data" applies to tab
  // closes and navigation just as much as a crash.
  useEffect(() => {
    if (aggregateSaveState !== "pending" && aggregateSaveState !== "saving") return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [aggregateSaveState]);

  useConsultationShortcuts(identityConfirmed);

  // Deterministic, client-side — no network, no schema read. Recomputes as the
  // doctor documents; recommendations self-resolve (e.g. the investigation
  // nudge disappears once investigations are recorded).
  const cdsRecommendations = useMemo(
    () => evaluateDecisionSupport({ visit, patient, pastVisits }),
    [visit, patient, pastVisits]
  );

  // Only fills a field that's currently blank — a template must never
  // silently overwrite what the doctor has already documented (Track 4.2's
  // "never silently lose data" principle applies here too).
  async function applyTemplateField(
    field: "history" | "generalExamination" | "perAbdomen" | "investigationAdvice" | "clinicalNote",
    ref: React.RefObject<HTMLTextAreaElement | null>,
    draft: ReturnType<typeof useDraftRecovery<HTMLTextAreaElement>>,
    value: string | undefined
  ) {
    if (!value) return;
    const el = ref.current;
    if (!el || el.value.trim()) return;
    el.value = value;
    let saved = false;
    switch (field) {
      case "history": saved = await updateVisit(visit.id, { history: value }); break;
      case "generalExamination": saved = await updateVisit(visit.id, { generalExamination: value }); break;
      case "perAbdomen": saved = await updateVisit(visit.id, { perAbdomen: value }); break;
      case "investigationAdvice": saved = await updateVisit(visit.id, { investigationAdvice: value }); break;
      case "clinicalNote": saved = await updateVisit(visit.id, { clinicalNote: value }); break;
    }
    if (saved) draft.onCommit();
  }

  // Quick-insert a frequently-used investigation set. Same blank-guard as a
  // template apply — never overwrites what the doctor has already documented.
  async function insertInvestigationFavourite(value: string) {
    const el = investigationAdviceRef.current;
    if (!el || el.value.trim()) return;
    el.value = value;
    setInvestigationAdviceEmpty(false);
    if (await updateVisit(visit.id, { investigationAdvice: value })) investigationAdviceDraft.onCommit();
  }

  // CDS actions append to the investigation/advice field (never overwrite) and
  // set the follow-up date — reusing the same uncontrolled-field commit paths
  // the rest of the pad uses. Advisory: the inserted text is a starting draft
  // the doctor reviews and edits before saving.
  async function appendInvestigationAdvice(text: string) {
    const el = investigationAdviceRef.current;
    if (!el) return;
    const next = el.value.trim() ? `${el.value.trim()}\n${text}` : text;
    el.value = next;
    setInvestigationAdviceEmpty(false);
    if (await updateVisit(visit.id, { investigationAdvice: next })) investigationAdviceDraft.onCommit();
  }

  async function setFollowUpInDays(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const value = date.toISOString().slice(0, 10);
    if (followUpDateRef.current) followUpDateRef.current.value = value;
    await updateVisit(visit.id, { followUpDate: value });
  }

  function handleCdsAction(rec: CdsRecommendation) {
    const action = rec.action;
    if (!action) return;
    switch (action.kind) {
      case "insert-investigation":
      case "insert-advice":
        void appendInvestigationAdvice(action.text);
        notify.success("Added — review and edit before saving.");
        break;
      case "set-follow-up":
        void setFollowUpInDays(action.days);
        notify.success(`Follow-up set for ${action.days} days.`);
        break;
    }
  }

  // Voice dictation always appends (never overwrites, even into a filled
  // field) — a doctor dictating a second thought shouldn't have to worry
  // about losing what's already there.
  async function appendToField(
    field: "presentingComplaints" | "history" | "generalExamination" | "clinicalNote",
    ref: React.RefObject<HTMLTextAreaElement | null>,
    draft: ReturnType<typeof useDraftRecovery<HTMLTextAreaElement>>,
    transcript: string
  ) {
    const el = ref.current;
    if (!el) return;
    const next = el.value.trim() ? `${el.value.trim()} ${transcript}` : transcript;
    el.value = next;
    let saved = false;
    switch (field) {
      case "presentingComplaints": saved = await updateVisit(visit.id, { presentingComplaints: next }); break;
      case "history": saved = await updateVisit(visit.id, { history: next }); break;
      case "generalExamination": saved = await updateVisit(visit.id, { generalExamination: next }); break;
      case "clinicalNote": saved = await updateVisit(visit.id, { clinicalNote: next }); break;
    }
    if (saved) draft.onCommit();
  }

  async function applyClinicalTemplate(template: ClinicalTemplate) {
    setDiagnosisApply({ value: template.diagnosis, nonce: Date.now() });
    await Promise.all([
      applyTemplateField("history", historyRef, historyDraft, template.history),
      applyTemplateField("generalExamination", generalExaminationRef, generalExaminationDraft, template.generalExamination),
      applyTemplateField("perAbdomen", perAbdomenRef, perAbdomenDraft, template.perAbdomen),
      applyTemplateField("investigationAdvice", investigationAdviceRef, investigationAdviceDraft, template.investigationAdvice),
      applyTemplateField("clinicalNote", clinicalNoteRef, clinicalNoteDraft, template.clinicalNote)
    ]);
    notify.success(`Applied "${template.name}" — review and edit before saving.`);
  }

  return (
    <article className="rounded border border-line/80 bg-white shadow-sm">
      <ConsultationStickyHeader
        visit={visit}
        patient={patient}
        aggregateSaveState={aggregateSaveState}
        onStatusChange={(status) => void updateVisit(visit.id, { status })}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />
      <ConsultationShortcutsDialog open={shortcutsOpen} setOpen={setShortcutsOpen} />

      <div className="grid gap-5 p-4">
        <ConsultationChecklist visit={visit} identityConfirmed={identityConfirmed} />

        <ClinicalDecisionSupportPanel
          visitId={visit.id}
          recommendations={cdsRecommendations}
          disabled={!identityConfirmed}
          onAction={handleCdsAction}
        />

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

        <PreviousVisitHistory phone={visit.phone} patientName={visit.patientName} />

        <TimelineComparisonPanel visit={visit} />

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

        <div id="visit-section-examination" className="grid scroll-mt-40 gap-4 rounded border border-line bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Clinical Examination</p>
            <ClinicalTemplateMenu
              currentFields={{
                diagnosis: visit.diagnosis ?? "",
                history: visit.history ?? "",
                generalExamination: visit.generalExamination ?? "",
                perAbdomen: visit.perAbdomen ?? "",
                investigationAdvice: visit.investigationAdvice ?? "",
                clinicalNote: visit.clinicalNote ?? ""
              }}
              onApply={(template) => void applyClinicalTemplate(template)}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <label>
              <span className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-ink">Presenting Complaints</span>
                <span className="flex items-center gap-2">
                  <VoiceDictationButton
                    disabled={!identityConfirmed}
                    onResult={(transcript) => void appendToField("presentingComplaints", presentingComplaintsRef, presentingComplaintsDraft, transcript)}
                  />
                  <SaveStatusIndicator state={presentingComplaintsDraft.saveState} />
                </span>
              </span>
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
              <span className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-ink">History</span>
                <span className="flex items-center gap-2">
                  <VoiceDictationButton
                    disabled={!identityConfirmed}
                    onResult={(transcript) => void appendToField("history", historyRef, historyDraft, transcript)}
                  />
                  <SaveStatusIndicator state={historyDraft.saveState} />
                </span>
              </span>
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

          <VitalsGrid visit={visit} disabled={!identityConfirmed} onUpdate={(updates) => void updateVisit(visit.id, updates)} />

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label htmlFor="visit-general-examination">
                <span className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-ink">General Examination</span>
                  <span className="flex items-center gap-2">
                    <VoiceDictationButton
                      disabled={!identityConfirmed}
                      onResult={(transcript) => void appendToField("generalExamination", generalExaminationRef, generalExaminationDraft, transcript)}
                    />
                    <SaveStatusIndicator state={generalExaminationDraft.saveState} />
                  </span>
                </span>
              </label>
              {generalExaminationDraft.restored ? <DraftRestoredNotice onDiscard={generalExaminationDraft.discard} /> : null}
              <QuickExamChips
                chips={generalExaminationChips}
                textareaRef={generalExaminationRef}
                disabled={!identityConfirmed}
                onCommit={async (value) => {
                  if (await updateVisit(visit.id, { generalExamination: value })) generalExaminationDraft.onCommit();
                }}
              />
              <textarea
                id="visit-general-examination"
                ref={generalExaminationRef}
                defaultValue={visit.generalExamination}
                onInput={generalExaminationDraft.onInput}
                onBlur={async (event) => {
                  if (await updateVisit(visit.id, { generalExamination: event.target.value })) generalExaminationDraft.onCommit();
                }}
                disabled={!identityConfirmed}
                className={textareaClass}
              />
            </div>
            <div>
              <label htmlFor="visit-per-abdomen">
                <span className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-ink">Per Abdomen</span>
                  <SaveStatusIndicator state={perAbdomenDraft.saveState} />
                </span>
              </label>
              {perAbdomenDraft.restored ? <DraftRestoredNotice onDiscard={perAbdomenDraft.discard} /> : null}
              <QuickExamChips
                chips={perAbdomenChips}
                textareaRef={perAbdomenRef}
                disabled={!identityConfirmed}
                onCommit={async (value) => {
                  if (await updateVisit(visit.id, { perAbdomen: value })) perAbdomenDraft.onCommit();
                }}
              />
              <textarea
                id="visit-per-abdomen"
                ref={perAbdomenRef}
                defaultValue={visit.perAbdomen}
                onInput={perAbdomenDraft.onInput}
                onBlur={async (event) => {
                  if (await updateVisit(visit.id, { perAbdomen: event.target.value })) perAbdomenDraft.onCommit();
                }}
                disabled={!identityConfirmed}
                className={textareaClass}
              />
            </div>
            <label>
              <span className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-ink">Prior Investigation</span>
                <SaveStatusIndicator state={priorInvestigationDraft.saveState} />
              </span>
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
              <span className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-ink">Advice / Procedure Instructions</span>
                <SaveStatusIndicator state={investigationAdviceDraft.saveState} />
              </span>
              {investigationAdviceDraft.restored ? <DraftRestoredNotice onDiscard={investigationAdviceDraft.discard} /> : null}
              {investigationAdviceEmpty ? (
                <FavouriteChips favourites={favouriteInvestigations} onPick={(value) => void insertInvestigationFavourite(value)} />
              ) : null}
              <textarea
                ref={investigationAdviceRef}
                defaultValue={visit.investigationAdvice}
                onInput={(event) => {
                  investigationAdviceDraft.onInput(event);
                  setInvestigationAdviceEmpty(!event.currentTarget.value.trim());
                }}
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
            <div id="visit-section-diagnosis" className="scroll-mt-40">
              <DiagnosisField
                key={`${visit.id}-diagnosis`}
                visit={visit}
                disabled={!identityConfirmed}
                favourites={favouriteDiagnoses}
                onSave={(value) => updateVisit(visit.id, { diagnosis: value })}
                applyTemplate={diagnosisApply}
                onSaveStateChange={setDiagnosisSaveState}
              />
              <Icd10CodePicker
                code={visit.diagnosisIcd10Code}
                label={visit.diagnosisIcd10Label}
                disabled={!identityConfirmed}
                onPick={(code, label) => void updateVisit(visit.id, { diagnosisIcd10Code: code, diagnosisIcd10Label: label })}
              />
            </div>
            <label id="visit-section-clinical-note" className="scroll-mt-40 block">
              <span className="mb-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-bold text-ink"><FileText size={16} /> Clinical Note</span>
                <span className="flex items-center gap-2">
                  <VoiceDictationButton
                    disabled={!identityConfirmed}
                    onResult={(transcript) => void appendToField("clinicalNote", clinicalNoteRef, clinicalNoteDraft, transcript)}
                  />
                  <SaveStatusIndicator state={clinicalNoteDraft.saveState} />
                </span>
              </span>
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
          <div id="visit-section-prescription" className="scroll-mt-40">
            <PrescriptionField
              key={visit.id}
              visit={visit}
              currentMedicines={patient?.currentMedicines}
              disabled={!identityConfirmed}
              favourites={favouritePrescriptions}
              favouriteItems={favouritePrescriptionItems}
              onSave={(value) => updateVisit(visit.id, { prescription: value })}
              onSaveItems={(items) => void updateVisit(visit.id, { prescriptionItems: items })}
              onSaveStateChange={setPrescriptionSaveState}
            />
          </div>
          <div id="visit-section-followup" className="scroll-mt-40">
            <label htmlFor="visit-followup-date">
              <span className="mb-2 block text-sm font-bold text-ink">Follow-up Date</span>
            </label>
            <input
              id="visit-followup-date"
              ref={followUpDateRef}
              type="date"
              defaultValue={visit.followUpDate}
              onBlur={(event) => void updateVisit(visit.id, { followUpDate: event.target.value })}
              disabled={!identityConfirmed}
              className={inputClass}
            />
            <FollowUpQuickPicks
              dateInputRef={followUpDateRef}
              disabled={!identityConfirmed}
              onCommit={(value) => void updateVisit(visit.id, { followUpDate: value })}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionButton variant="secondary" className="whitespace-nowrap" onClick={() => void copySummary(visit, patient)}>
                <Copy size={16} /> Copy Summary
              </ActionButton>
              <ActionButton variant="primary" className="whitespace-nowrap" onClick={() => printSummary(visit, patient)}>
                <Printer size={16} /> Print
              </ActionButton>
              <PdfPreviewButton
                href={`/api/pdf/medical-certificate?visitId=${encodeURIComponent(visit.id)}`}
                title={`Medical Certificate — ${visit.patientName}`}
                label="Certificate"
                variant="secondary"
                size="md"
              />
              {visit.referralLetter?.trim() ? (
                <PdfPreviewButton
                  href={`/api/pdf/referral-letter?visitId=${encodeURIComponent(visit.id)}`}
                  title={`Referral Letter — ${visit.patientName}`}
                  label="Referral Letter"
                  variant="secondary"
                  size="md"
                />
              ) : null}
              <PdfPreviewButton
                href={`/api/pdf/prescription?visitId=${encodeURIComponent(visit.id)}`}
                title={`Prescription — ${visit.patientName}`}
                label="Prescription"
                variant="success"
                size="md"
              />
              <PatientEducationMenu visit={visit} />
            </div>
          </div>
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
          <label id="visit-section-referral" className="scroll-mt-40 block">
            <span className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-ink">Referral Letter</span>
              <SaveStatusIndicator state={referralLetterDraft.saveState} />
            </span>
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
          <label id="visit-section-certificate" className="scroll-mt-40 block">
            <span className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-ink">Certificate Note</span>
              <SaveStatusIndicator state={certificateNoteDraft.saveState} />
            </span>
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
