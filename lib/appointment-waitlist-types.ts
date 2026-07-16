/**
 * Appointment waitlist (Track roadmap addon) — when a scheduled appointment
 * is cancelled, the oldest matching waitlisted patient is automatically
 * offered that slot rather than it going to waste. "Offered" still requires
 * a human to actually contact the patient (no SMS/WhatsApp Business API
 * exists yet to notify them directly) — the automation is detecting the
 * match instantly and alerting reception, not a fully unattended message.
 */
export type AppointmentWaitlistStatus = "Waiting" | "Offered" | "Booked" | "Cancelled";

export type AppointmentWaitlistEntry = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  phone: string;
  service: string;
  /** Blank means "any date works" — matches any cancellation for this service. */
  preferredDate?: string;
  notes?: string;
  status: AppointmentWaitlistStatus;
  /** The cancelled appointment whose slot was offered to this entry. */
  offeredAppointmentId?: string;
  offeredAt?: string;
};

export const appointmentWaitlistStatuses: AppointmentWaitlistStatus[] = ["Waiting", "Offered", "Booked", "Cancelled"];
