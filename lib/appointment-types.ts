export type AppointmentStatus = "New" | "Contacted" | "Confirmed" | "Completed" | "Cancelled";

export type AppointmentRecord = {
  id: string;
  patientId?: string;
  uhid?: string;
  createdAt: string;
  status: AppointmentStatus;
  name: string;
  phone: string;
  email?: string;
  age?: string;
  gender?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  patientType?: string;
  contactMethod?: string;
  service: string;
  countryCode?: string;
  admissionReason?: string;
  insuranceTpa?: string;
  roomPreference?: string;
  hasReferral?: string;
  referredBy?: string;
  date?: string;
  timeSlot?: string;
  priority?: string;
  symptoms: string[];
  duration?: string;
  medicines?: string;
  assistance?: string;
  report?: string;
  message?: string;
};

export const appointmentStatuses: AppointmentStatus[] = ["New", "Contacted", "Confirmed", "Completed", "Cancelled"];
