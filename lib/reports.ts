import "server-only";
import { listAppointments } from "@/lib/appointment-store";
import { listAiReviews } from "@/lib/ai-review-store";
import { listAutomationTasks } from "@/lib/automation-store";
import { listCommunicationLogs } from "@/lib/communication-store";
import { listAccountEntries, listInsuranceClaims } from "@/lib/finance-store";
import { listAttendance, listStaff } from "@/lib/hr-store";
import { listInventoryItems } from "@/lib/inventory-store";
import { listBeds, listIpdAdmissions } from "@/lib/ipd-store";
import { listLabOrders } from "@/lib/lab-store";
import { listOpdVisits } from "@/lib/opd-store";
import { listPatients } from "@/lib/patient-store";
import { listPharmacyDispenses } from "@/lib/pharmacy-store";
import { listProcedureSchedules, procedureChecklistProgress } from "@/lib/procedure-store";

function amountValue(value: string | undefined) {
  const parsed = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function createAdminReport() {
  const today = todayKey();
  const accountEntries = (await listAccountEntries());
  const aiReviews = (await listAiReviews());
  const appointments = (await listAppointments());
  const automationTasks = (await listAutomationTasks());
  const communicationLogs = (await listCommunicationLogs());
  const claims = (await listInsuranceClaims());
  const staff = await listStaff();
  const attendance = await listAttendance();
  const opdVisits = (await listOpdVisits());
  const inventory = (await listInventoryItems());
  const beds = (await listBeds());
  const ipdAdmissions = (await listIpdAdmissions());
  const labOrders = (await listLabOrders());
  const patients = (await listPatients());
  const dispenses = (await listPharmacyDispenses());
  const procedureSchedules = (await listProcedureSchedules());
  const todaysDispenses = dispenses.filter((record) => record.createdAt.slice(0, 10) === today);
  const todaysLabOrders = labOrders.filter((order) => order.createdAt.slice(0, 10) === today);
  const todaysProcedures = procedureSchedules.filter((schedule) => schedule.scheduledDate === today);
  const todaysDischarges = ipdAdmissions.filter((admission) => admission.dischargedAt?.slice(0, 10) === today);
  const todaysAttendance = attendance.filter((record) => record.date === today);

  const todaysAppointments = appointments.filter((appointment) => appointment.createdAt.slice(0, 10) === today);
  const todaysCommunicationLogs = communicationLogs.filter((log) => log.createdAt.slice(0, 10) === today || log.sentAt?.slice(0, 10) === today);
  const todaysEntries = accountEntries.filter((entry) => entry.date === today);
  const todaysOpdVisits = opdVisits.filter((visit) => visit.createdAt.slice(0, 10) === today);
  const paidVisits = opdVisits.filter((visit) => visit.billingStatus === "Paid");
  const todaysPaidVisits = paidVisits.filter((visit) => visit.paidAt?.slice(0, 10) === today);
  const lowStockItems = inventory.filter((item) => item.quantity <= item.reorderLevel);

  const revenueByMethod = ["Cash", "UPI", "Card", "Insurance", "Other"].map((method) => ({
    method,
    total: todaysPaidVisits
      .filter((visit) => (visit.paymentMethod || "Cash") === method)
      .reduce((sum, visit) => sum + amountValue(visit.estimatedAmount), 0)
  }));

  return {
    generatedAt: new Date().toISOString(),
    appointments: {
      total: appointments.length,
      today: todaysAppointments.length,
      new: appointments.filter((appointment) => appointment.status === "New").length,
      confirmed: appointments.filter((appointment) => appointment.status === "Confirmed").length,
      urgent: appointments.filter((appointment) => appointment.priority === "Urgent symptoms").length
    },
    patients: {
      total: patients.length,
      active: patients.filter((patient) => patient.status === "Active").length,
      flagged: patients.filter((patient) => patient.status === "Flagged").length,
      addedToday: patients.filter((patient) => patient.createdAt.slice(0, 10) === today).length
    },
    opd: {
      total: opdVisits.length,
      today: todaysOpdVisits.length,
      waiting: opdVisits.filter((visit) => visit.status === "Waiting").length,
      inConsultation: opdVisits.filter((visit) => visit.status === "In Consultation").length,
      completedToday: todaysOpdVisits.filter((visit) => visit.status === "Completed").length
    },
    billing: {
      paidToday: todaysPaidVisits.reduce((sum, visit) => sum + amountValue(visit.estimatedAmount), 0),
      paidTotal: paidVisits.reduce((sum, visit) => sum + amountValue(visit.estimatedAmount), 0),
      pendingEstimate: opdVisits
        .filter((visit) => visit.billingStatus !== "Paid")
        .reduce((sum, visit) => sum + amountValue(visit.estimatedAmount), 0),
      receiptsToday: todaysPaidVisits.length,
      revenueByMethod
    },
    pharmacy: {
      dispensesToday: todaysDispenses.length,
      totalDispenses: dispenses.length,
      paidToday: todaysDispenses.filter((record) => record.paymentStatus === "Paid").reduce((sum, record) => sum + record.total, 0),
      unpaidTotal: dispenses.filter((record) => record.paymentStatus === "Unpaid").reduce((sum, record) => sum + record.total, 0)
    },
    lab: {
      ordersToday: todaysLabOrders.length,
      totalOrders: labOrders.length,
      resultReady: labOrders.filter((order) => order.status === "Result Ready").length,
      paidToday: todaysLabOrders.filter((order) => order.paymentStatus === "Paid").reduce((sum, order) => sum + Number(order.amount || 0), 0),
      unpaidTotal: labOrders.filter((order) => order.paymentStatus === "Unpaid").reduce((sum, order) => sum + Number(order.amount || 0), 0)
    },
    procedures: {
      scheduledToday: todaysProcedures.length,
      totalScheduled: procedureSchedules.length,
      active: procedureSchedules.filter((schedule) => ["Prep Started", "In Procedure", "Recovery"].includes(schedule.status)).length,
      completedToday: todaysProcedures.filter((schedule) => schedule.status === "Completed").length,
      readyToday: todaysProcedures.filter((schedule) => procedureChecklistProgress(schedule) === 100).length
    },
    ipd: {
      totalBeds: beds.length,
      vacantBeds: beds.filter((bed) => bed.status === "Vacant").length,
      occupiedBeds: beds.filter((bed) => bed.status === "Occupied").length,
      activeAdmissions: ipdAdmissions.filter((admission) => admission.status === "Admitted").length,
      dischargesToday: todaysDischarges.length
    },
    finance: {
      activeClaims: claims.filter((claim) => !["Rejected", "Settled"].includes(claim.status)).length,
      settledClaims: claims.filter((claim) => claim.status === "Settled").length,
      claimSettledTotal: claims.reduce((sum, claim) => sum + claim.settledAmount, 0),
      incomeToday: todaysEntries.filter((entry) => ["Income", "Deposit"].includes(entry.type)).reduce((sum, entry) => sum + entry.amount, 0),
      expenseToday: todaysEntries.filter((entry) => ["Expense", "Refund"].includes(entry.type)).reduce((sum, entry) => sum + entry.amount, 0),
      ledgerBalance: accountEntries.reduce((sum, entry) => {
        const sign = ["Income", "Deposit"].includes(entry.type) ? 1 : -1;
        return sum + sign * entry.amount;
      }, 0)
    },
    hr: {
      totalStaff: staff.length,
      activeStaff: staff.filter((member) => member.status === "Active").length,
      onLeave: staff.filter((member) => member.status === "On Leave").length,
      presentToday: todaysAttendance.filter((record) => record.status === "Present").length,
      absentToday: todaysAttendance.filter((record) => record.status === "Absent").length
    },
    communication: {
      totalLogs: communicationLogs.length,
      today: todaysCommunicationLogs.length,
      sentToday: todaysCommunicationLogs.filter((log) => log.status === "Sent").length,
      queued: communicationLogs.filter((log) => log.status === "Queued").length,
      followUpNeeded: communicationLogs.filter((log) => log.status === "Follow-up Needed").length
    },
    ai: {
      totalReviews: aiReviews.length,
      needsReview: aiReviews.filter((review) => review.status === "Needs Review").length,
      escalated: aiReviews.filter((review) => review.status === "Escalated").length,
      reviewed: aiReviews.filter((review) => review.status === "Reviewed").length
    },
    automation: {
      totalTasks: automationTasks.length,
      open: automationTasks.filter((task) => task.status === "Open").length,
      queued: automationTasks.filter((task) => task.status === "Queued").length,
      escalated: automationTasks.filter((task) => task.status === "Escalated").length,
      done: automationTasks.filter((task) => task.status === "Done").length
    },
    inventory: {
      totalItems: inventory.length,
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        reorderLevel: item.reorderLevel,
        unit: item.unit
      }))
    }
  };
}
