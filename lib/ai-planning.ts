import type { AppointmentRecord } from "@/lib/appointment-types";

export type AppointmentPlanningNote = {
  urgency: "Routine" | "Priority Review" | "Urgent Reception Call";
  route: string;
  summary: string;
  flags: string[];
  preparation: string[];
  receptionScript: string;
  safetyNote: string;
};

const urgentSymptoms = ["Blood in stool", "Black stool", "Vomiting", "Jaundice", "Pancreatitis pain", "Liver swelling / ascites", "Weight loss"];
const procedureKeywords = ["Endoscopy", "Colonoscopy", "ERCP", "Fibroscan", "GI Stenting", "CBD", "Polypectomy", "Banding"];

function hasAny(value: string[], matches: string[]) {
  return value.some((item) => matches.some((match) => item.toLowerCase().includes(match.toLowerCase())));
}

function routeForAppointment(appointment: AppointmentRecord) {
  const service = appointment.service.toLowerCase();
  const symptoms = appointment.symptoms.join(" ").toLowerCase();

  if (service.includes("ercp") || symptoms.includes("jaundice") || service.includes("cbd")) return "Pancreato-biliary / ERCP review";
  if (service.includes("colonoscopy") || symptoms.includes("blood in stool") || symptoms.includes("constipation")) return "Colonoscopy / lower GI review";
  if (service.includes("fibroscan") || symptoms.includes("fatty liver") || symptoms.includes("liver")) return "Liver clinic review";
  if (hasAny([appointment.service], procedureKeywords)) return "Procedure coordination";
  return "Gastroenterology consultation";
}

export function createAppointmentPlanningNote(appointment: AppointmentRecord): AppointmentPlanningNote {
  const urgentFlag = appointment.priority === "Urgent symptoms" || hasAny(appointment.symptoms, urgentSymptoms);
  const procedureFlag = hasAny([appointment.service], procedureKeywords);
  const hasReport = Boolean(appointment.report);
  const flags = [
    urgentFlag ? "Priority symptom review required" : "",
    appointment.assistance ? "Movement assistance requested" : "",
    hasReport ? "Report/prescription file noted" : "Ask patient to carry reports",
    appointment.medicines ? "Current medicines/allergies provided" : "Confirm current medicines/allergies",
    procedureFlag ? "Procedure preparation may be needed" : ""
  ].filter(Boolean);

  const preparation = [
    "Confirm patient name, phone number and preferred visit window.",
    "Ask patient to carry previous reports, prescriptions and current medicines.",
    procedureFlag ? "Confirm fasting, attendant and medicine instructions before procedure visit." : "Confirm whether consultation or procedure planning is required.",
    appointment.assistance ? "Arrange wheelchair or attendant movement support at arrival." : "Ask if the patient needs wheelchair or movement assistance.",
    urgentFlag ? "Call patient before scheduling to check current severity and advise direct doctor/reception escalation." : "Share appointment confirmation on WhatsApp after reception review."
  ];

  const route = routeForAppointment(appointment);
  const urgency: AppointmentPlanningNote["urgency"] = urgentFlag
    ? "Urgent Reception Call"
    : appointment.priority === "Soon"
      ? "Priority Review"
      : "Routine";

  return {
    urgency,
    route,
    summary: `${appointment.name} requested ${appointment.service || "a gastro appointment"}${appointment.date ? ` for ${appointment.date}` : ""}. Symptoms noted: ${appointment.symptoms.length ? appointment.symptoms.join(", ") : "not specified"}.`,
    flags,
    preparation,
    receptionScript: `Hello ${appointment.name}, this is Mudgal Gastromedics Hospital reception. We received your request for ${appointment.service}. Please confirm your preferred time, current symptoms, and whether you have previous reports or prescriptions. For urgent symptoms, please call reception directly.`,
    safetyNote: "AI planning support is for reception and doctor review only. It does not diagnose, prescribe or replace clinical judgment."
  };
}
