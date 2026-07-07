import type { AiCaseReview } from "@/lib/ai-types";
import type { AppointmentRecord } from "@/lib/appointment-types";
import type { InventoryItem } from "@/lib/inventory-types";
import { inventoryExpiryStatus } from "@/lib/inventory-types";
import type { IpdAdmission, VitalsReading } from "@/lib/ipd-types";
import { computeHduEscalation, hduVitalsOverdueMinutes } from "@/lib/ipd-types";
import type { NotificationCategory, NotificationPriority } from "@/lib/notification-types";
import type { OpdVisit } from "@/lib/opd-types";

export type NotificationInput = {
  source: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  detail: string;
  href?: string;
};

/** Waiting longer than this in the OPD queue raises a staff notification. */
export const opdWaitAlertMinutes = 60;

/** Rule prefixes owned by the sync; open notifications with these sources auto-resolve when the condition clears. */
export const notificationRulePrefixes = ["low-stock:", "expiry:", "urgent-appointment:", "hdu:", "ai-review:", "opd-wait:"];

export type NotificationRuleInputs = {
  inventory: InventoryItem[];
  appointments: AppointmentRecord[];
  admissions: IpdAdmission[];
  vitals: VitalsReading[];
  aiReviews: AiCaseReview[];
  opdVisits: OpdVisit[];
};

/**
 * Pure evaluation of the operational alert rules (Track 2.4). Every produced
 * notification is explainable — the detail always says why the rule fired —
 * and non-blocking: these inform staff, they never obstruct a workflow.
 */
export function evaluateNotificationRules(inputs: NotificationRuleInputs, now = new Date()): NotificationInput[] {
  const active: NotificationInput[] = [];

  for (const item of inputs.inventory) {
    if (item.quantity <= item.reorderLevel) {
      active.push({
        source: `low-stock:${item.id}`,
        category: "Pharmacy",
        priority: item.quantity === 0 ? "Critical" : "High",
        title: `Low stock: ${item.name}`,
        detail: `${item.quantity} ${item.unit} left — at or below the reorder level of ${item.reorderLevel}.`,
        href: "/admin#module-inventory"
      });
    }
    const expiry = inventoryExpiryStatus(item, now);
    if (expiry) {
      active.push({
        source: `expiry:${item.id}`,
        category: "Pharmacy",
        priority: expiry === "expired" ? "Critical" : "High",
        title: expiry === "expired" ? `Expired stock: ${item.name}` : `Expiring soon: ${item.name}`,
        detail:
          expiry === "expired"
            ? `Expiry date ${item.expiryDate} has passed — quarantine this stock; it must not be dispensed.`
            : `Expires on ${item.expiryDate}. Plan return or priority use before expiry.`,
        href: "/admin#module-inventory"
      });
    }
  }

  for (const appointment of inputs.appointments) {
    if (appointment.priority === "Urgent symptoms" && (appointment.status === "New" || appointment.status === "Contacted")) {
      active.push({
        source: `urgent-appointment:${appointment.id}`,
        category: "Clinical",
        priority: "Critical",
        title: `Urgent symptoms: ${appointment.name}`,
        detail: `Appointment request flagged urgent (${appointment.symptoms.join(", ") || "symptoms not listed"}) and still ${appointment.status.toLowerCase()}.`,
        href: "/admin#module-appointments"
      });
    }
  }

  for (const admission of inputs.admissions) {
    if (admission.status !== "Admitted" || admission.ward !== "HDU") continue;
    const escalation = computeHduEscalation(admission, inputs.vitals, now.getTime());
    if (escalation.flagged) {
      const reasons = [
        escalation.overdue
          ? `vitals overdue (last check ${escalation.lastVitalsAt ? new Date(escalation.lastVitalsAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "not recorded"}, limit ${hduVitalsOverdueMinutes} min)`
          : "",
        escalation.outOfThreshold ? "a reading is outside monitoring thresholds" : "",
        admission.escalated ? "manually escalated by staff" : ""
      ].filter(Boolean);
      active.push({
        source: `hdu:${admission.id}`,
        category: "Emergency",
        priority: "Critical",
        title: `HDU attention: bed ${admission.bedLabel}`,
        detail: `Staff-attention flag (never a diagnosis): ${reasons.join("; ")}.`,
        href: "/admin#module-ipd"
      });
    }
  }

  for (const review of inputs.aiReviews) {
    if (review.status === "Escalated") {
      active.push({
        source: `ai-review:${review.id}`,
        category: "Administrative",
        priority: "High",
        title: "Escalated AI review",
        detail: "An AI-generated item was escalated by a reviewer and needs a decision.",
        href: "/admin#module-ai-reviews"
      });
    }
  }

  for (const visit of inputs.opdVisits) {
    if (visit.status !== "Waiting") continue;
    const waitedMinutes = Math.round((now.getTime() - new Date(visit.createdAt).getTime()) / 60000);
    if (waitedMinutes >= opdWaitAlertMinutes) {
      active.push({
        source: `opd-wait:${visit.id}`,
        category: "Clinical",
        priority: "High",
        title: `Long wait: ${visit.patientName}`,
        detail: `Token ${visit.token} has been waiting ${waitedMinutes} minutes (alert threshold ${opdWaitAlertMinutes}).`,
        href: "/admin#module-opd"
      });
    }
  }

  return active;
}
