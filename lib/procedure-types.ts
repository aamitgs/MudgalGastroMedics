export type ProcedureScheduleStatus = "Planned" | "Prep Started" | "In Procedure" | "Recovery" | "Completed" | "Cancelled";

export type ProcedureChecklist = {
  consent: boolean;
  fastingConfirmed: boolean;
  vitalsChecked: boolean;
  allergiesReviewed: boolean;
  reportsReviewed: boolean;
  attendantAvailable: boolean;
  equipmentReady: boolean;
  recoveryInstructions: boolean;
};

export type ProcedureSchedule = {
  id: string;
  createdAt: string;
  updatedAt: string;
  visitId: string;
  token: string;
  patientId?: string;
  uhid?: string;
  patientName: string;
  phone: string;
  procedureSlug: string;
  procedureTitle: string;
  scheduledDate: string;
  scheduledTime: string;
  room: string;
  doctor: string;
  anesthesiaPlan?: string;
  priority: "Routine" | "Urgent";
  status: ProcedureScheduleStatus;
  checklist: ProcedureChecklist;
  findings?: string;
  complications?: string;
  notes?: string;
};

export const procedureScheduleStatuses: ProcedureScheduleStatus[] = ["Planned", "Prep Started", "In Procedure", "Recovery", "Completed", "Cancelled"];

export const defaultProcedureChecklist: ProcedureChecklist = {
  consent: false,
  fastingConfirmed: false,
  vitalsChecked: false,
  allergiesReviewed: false,
  reportsReviewed: false,
  attendantAvailable: false,
  equipmentReady: false,
  recoveryInstructions: false
};

export const procedureRooms = ["Endoscopy Room", "ERCP Suite", "Procedure Room", "HDU Bedside"];
