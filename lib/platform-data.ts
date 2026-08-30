export const platformModules = [
  {
    title: "Public Website",
    text: "Patient-facing service pages, appointment requests, WhatsApp handoff, directions, reviews and education.",
    tag: "Frontend"
  },
  {
    title: "Internal CMS",
    text: "A private publishing layer for procedure pages, gallery media, SEO metadata and approval workflow.",
    tag: "Content ops"
  },
  {
    title: "Patient Portal",
    text: "OTP-based patient access for appointments, reports, prescriptions, visit instructions and follow-up reminders.",
    tag: "Patient access"
  },
  {
    title: "Hospital Operations",
    text: "Reception, OPD queue, doctor schedule, billing, pharmacy, inventory, staff roles and operational reports.",
    tag: "Hospital operations"
  },
  {
    title: "AI Planning",
    text: "Assisted triage, report summaries, preparation checklists, recall reminders and reception workflow suggestions.",
    tag: "Clinical support"
  }
];

export const operationsFeatures = [
  "Patient registration",
  "OPD queue board",
  "Doctor schedule",
  "Billing and receipts",
  "Procedure records",
  "Pharmacy and stock",
  "Report uploads",
  "Daily revenue summary",
  "Staff roles and permissions",
  "Patient communication logs"
];

export const aiPlanningFeatures = [
  "Symptom-based appointment routing",
  "Report summary for doctor review",
  "Pre-procedure preparation checklist",
  "Follow-up recall suggestions",
  "Reception response drafts",
  "SEO and patient education planning",
  "Risk flag reminders for urgent escalation",
  "No automated diagnosis or treatment decision"
];

export const implementationPhases = [
  {
    phase: "Phase 1",
    title: "Public Website + Smart Appointment Layer",
    text: "The frontend remains the patient-facing front door for appointment capture, report attachment, WhatsApp handoff and patient routing."
  },
  {
    phase: "Phase 2",
    title: "Reception Dashboard",
    text: "Appointment requests, patient uploads, callbacks, OPD queue and staff actions move into a private admin workspace."
  },
  {
    phase: "Phase 3",
    title: "Internal CMS",
    text: "Approved staff can update procedure content, gallery images, SEO fields and publish-ready website copy without mixing it with hospital operations."
  },
  {
    phase: "Phase 4",
    title: "Patient Portal",
    text: "Patients access visit history, instructions, reports, prescriptions and follow-up reminders through mobile OTP."
  },
  {
    phase: "Phase 5",
    title: "Hospital Operations Core",
    text: "Billing, pharmacy, inventory, staff roles, procedure records and daily reporting become connected modules."
  },
  {
    phase: "Phase 6",
    title: "AI Planning Assistant",
    text: "AI supports reception, doctor review and patient education while keeping medical decisions under clinician control."
  }
];
