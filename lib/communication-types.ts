export type CommunicationChannel = "Call" | "WhatsApp" | "SMS" | "Email";

export type CommunicationStatus = "Draft" | "Queued" | "Sent" | "Failed" | "Follow-up Needed";

export type CommunicationTemplateKey = "Appointment Confirmation" | "Procedure Preparation" | "Report Ready" | "Follow-up Reminder" | "Payment Reminder" | "General Update";

export type CommunicationLog = {
  id: string;
  createdAt: string;
  updatedAt: string;
  patientId?: string;
  uhid?: string;
  patientName: string;
  phone: string;
  channel: CommunicationChannel;
  template: CommunicationTemplateKey;
  status: CommunicationStatus;
  subject: string;
  message: string;
  scheduledFor?: string;
  sentAt?: string;
  owner?: string;
  notes?: string;
};

export const communicationChannels: CommunicationChannel[] = ["Call", "WhatsApp", "SMS", "Email"];

export const communicationStatuses: CommunicationStatus[] = ["Draft", "Queued", "Sent", "Failed", "Follow-up Needed"];

export const communicationTemplates: Array<{
  key: CommunicationTemplateKey;
  subject: string;
  message: string;
}> = [
  {
    key: "Appointment Confirmation",
    subject: "Appointment confirmation",
    message: "Dear patient, your appointment at Mudgal Gastromedics Hospital is confirmed. Please carry prior reports and reach 10 minutes before your slot."
  },
  {
    key: "Procedure Preparation",
    subject: "Procedure preparation instructions",
    message: "Dear patient, please follow the preparation instructions shared by reception. Bring previous reports, medicines list and an attendant if advised."
  },
  {
    key: "Report Ready",
    subject: "Report ready for review",
    message: "Dear patient, your report is ready. Please contact Mudgal Gastromedics Hospital reception for review and follow-up guidance."
  },
  {
    key: "Follow-up Reminder",
    subject: "Follow-up reminder",
    message: "Dear patient, this is a reminder for your follow-up at Mudgal Gastromedics Hospital. Please call reception if you need to reschedule."
  },
  {
    key: "Payment Reminder",
    subject: "Payment reminder",
    message: "Dear patient, a payment is pending for your hospital visit. Please contact reception for bill details and support."
  },
  {
    key: "General Update",
    subject: "Hospital update",
    message: "Dear patient, Mudgal Gastromedics Hospital reception has an update for you. Please call or WhatsApp us when convenient."
  }
];
