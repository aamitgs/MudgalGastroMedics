import "server-only";
import { listAppointments } from "@/lib/appointment-store";
import { listAiReviews } from "@/lib/ai-review-store";
import { listCommunicationLogs } from "@/lib/communication-store";
import { listAccountEntries } from "@/lib/finance-store";
import { listAttendance, listStaff } from "@/lib/hr-store";
import type { DashboardMetric, NavBadgeCounts } from "@/lib/hospital-os-data";
import { listInventoryItems } from "@/lib/inventory-store";
import { inventoryExpiryStatus } from "@/lib/inventory-types";
import { getOccupancyStats, listBeds, listIpdAdmissions } from "@/lib/ipd-store";
import { listLabOrders } from "@/lib/lab-store";
import { listOpdVisits } from "@/lib/opd-store";
import { listPatients } from "@/lib/patient-store";
import { listPharmacyDispenses } from "@/lib/pharmacy-store";
import { listProcedureSchedules } from "@/lib/procedure-store";

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysBack(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (count - 1 - index));
    return dateKey(date);
  });
}

function amountValue(value: string | undefined) {
  const parsed = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function topCounts(items: string[], fallback = "Uncategorized") {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = item.trim() || fallback;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 8);
}

export async function createAnalyticsSnapshot(windowDays = 14) {
  const days = daysBack(windowDays);
  const appointments = (await listAppointments());
  const aiReviews = (await listAiReviews());
  const communicationLogs = (await listCommunicationLogs());
  const accountEntries = (await listAccountEntries());
  const attendance = await listAttendance();
  const staff = await listStaff();
  const inventory = (await listInventoryItems());
  const beds = (await listBeds());
  const admissions = (await listIpdAdmissions());
  const labOrders = (await listLabOrders());
  const opdVisits = (await listOpdVisits());
  const patients = (await listPatients());
  const dispenses = (await listPharmacyDispenses());
  const procedures = (await listProcedureSchedules());
  const paidVisits = opdVisits.filter((visit) => visit.billingStatus === "Paid");
  const activeAdmissions = admissions.filter((admission) => admission.status === "Admitted");

  const trend = days.map((day) => {
    const dayAppointments = appointments.filter((appointment) => appointment.createdAt.slice(0, 10) === day);
    const dayOpd = opdVisits.filter((visit) => visit.createdAt.slice(0, 10) === day);
    const dayPaid = paidVisits.filter((visit) => visit.paidAt?.slice(0, 10) === day);
    const dayLab = labOrders.filter((order) => order.createdAt.slice(0, 10) === day);
    const dayPharmacy = dispenses.filter((record) => record.createdAt.slice(0, 10) === day);
    const dayProcedures = procedures.filter((procedure) => procedure.scheduledDate === day);
    return {
      date: day,
      appointments: dayAppointments.length,
      opd: dayOpd.length,
      revenue: dayPaid.reduce((sum, visit) => sum + amountValue(visit.estimatedAmount), 0),
      lab: dayLab.length,
      pharmacy: dayPharmacy.length,
      procedures: dayProcedures.length
    };
  });

  const appointmentToOpd = appointments.length ? opdVisits.filter((visit) => visit.appointmentId).length : 0;
  const revenueTotal = paidVisits.reduce((sum, visit) => sum + amountValue(visit.estimatedAmount), 0);
  const ledgerIncome = accountEntries.filter((entry) => ["Income", "Deposit"].includes(entry.type)).reduce((sum, entry) => sum + entry.amount, 0);
  const ledgerExpense = accountEntries.filter((entry) => ["Expense", "Refund"].includes(entry.type)).reduce((sum, entry) => sum + entry.amount, 0);

  return {
    generatedAt: new Date().toISOString(),
    range: {
      days: days.length,
      from: days[0],
      to: days[days.length - 1]
    },
    executive: {
      appointmentConversion: percent(appointmentToOpd, appointments.length),
      opdCompletionRate: percent(opdVisits.filter((visit) => visit.status === "Completed").length, opdVisits.length),
      bedOccupancy: percent(beds.filter((bed) => bed.status === "Occupied").length, beds.length),
      stockRisk: percent(inventory.filter((item) => item.quantity <= item.reorderLevel).length, inventory.length),
      staffPresence: percent(attendance.filter((record) => record.status === "Present").length, attendance.length),
      aiReviewRate: percent(aiReviews.filter((review) => review.status === "Reviewed").length, aiReviews.length)
    },
    volume: {
      appointments: appointments.length,
      patients: patients.length,
      opd: opdVisits.length,
      procedures: procedures.length,
      labOrders: labOrders.length,
      pharmacyDispenses: dispenses.length,
      activeAdmissions: activeAdmissions.length,
      communicationLogs: communicationLogs.length
    },
    financial: {
      opdRevenue: revenueTotal,
      ledgerIncome,
      ledgerExpense,
      ledgerBalance: ledgerIncome - ledgerExpense,
      pharmacyRevenue: dispenses.filter((record) => record.paymentStatus === "Paid").reduce((sum, record) => sum + record.total, 0),
      labRevenue: labOrders.filter((order) => order.paymentStatus === "Paid").reduce((sum, order) => sum + Number(order.amount || 0), 0)
    },
    trend,
    serviceMix: topCounts([...appointments.map((appointment) => appointment.service), ...opdVisits.map((visit) => visit.service)]),
    symptomMix: topCounts(appointments.flatMap((appointment) => appointment.symptoms).concat(opdVisits.flatMap((visit) => visit.symptoms)), "Not specified"),
    paymentMix: topCounts(paidVisits.map((visit) => visit.paymentMethod || "Cash")),
    queues: {
      opdInFlight: opdVisits.filter((visit) => visit.status === "Waiting" || visit.status === "In Consultation").length,
      labPending: labOrders.filter((order) => !["Result Ready", "Delivered", "Cancelled"].includes(order.status)).length,
      pharmacyUnpaid: dispenses.filter((record) => record.paymentStatus === "Unpaid").length,
      receptionNew: appointments.filter((appointment) => appointment.status === "New").length
    },
    workload: [
      { label: "Reception Requests", value: appointments.filter((appointment) => appointment.status === "New").length },
      { label: "Waiting OPD", value: opdVisits.filter((visit) => visit.status === "Waiting").length },
      { label: "Procedure Active", value: procedures.filter((procedure) => ["Prep Started", "In Procedure", "Recovery"].includes(procedure.status)).length },
      { label: "Lab Pending", value: labOrders.filter((order) => !["Result Ready", "Delivered", "Cancelled"].includes(order.status)).length },
      { label: "Pharmacy Unpaid", value: dispenses.filter((record) => record.paymentStatus === "Unpaid").length },
      { label: "AI Needs Review", value: aiReviews.filter((review) => review.status === "Needs Review").length },
      { label: "Follow-up Messages", value: communicationLogs.filter((log) => log.status === "Follow-up Needed").length },
      { label: "Staff Active", value: staff.filter((member) => member.status === "Active").length }
    ],
    risks: {
      urgentAppointments: appointments.filter((appointment) => appointment.priority === "Urgent symptoms").length,
      lowStockItems: inventory.filter((item) => item.quantity <= item.reorderLevel).length,
      expiringItems: inventory.filter((item) => inventoryExpiryStatus(item) !== null).length,
      flaggedPatients: patients.filter((patient) => patient.status === "Flagged").length,
      escalatedAiReviews: aiReviews.filter((review) => review.status === "Escalated").length,
      unpaidLab: labOrders.filter((order) => order.paymentStatus === "Unpaid").length,
      unpaidPharmacy: dispenses.filter((record) => record.paymentStatus === "Unpaid").length,
      criticalLabsUnacked: labOrders.filter((order) => order.criticalFlag && !order.criticalAcknowledgedAt && order.status !== "Cancelled").length
    }
  };
}

export type AnalyticsSnapshot = Awaited<ReturnType<typeof createAnalyticsSnapshot>>;

/** Real KPI tiles for the Hospital OS command center, replacing static demo figures. */
export async function createHospitalOsDashboardMetrics(precomputed?: AnalyticsSnapshot): Promise<DashboardMetric[]> {
  const snapshot = precomputed ?? (await createAnalyticsSnapshot());
  const occupancy = (await getOccupancyStats());
  const today = snapshot.trend[snapshot.trend.length - 1];
  const yesterday = snapshot.trend[snapshot.trend.length - 2];

  const opdDiff = today.opd - (yesterday?.opd ?? 0);
  const revenueDiffPercent = yesterday?.revenue ? Math.round(((today.revenue - yesterday.revenue) / yesterday.revenue) * 100) : 0;
  const criticalAlerts = snapshot.risks.urgentAppointments + snapshot.risks.lowStockItems + snapshot.risks.escalatedAiReviews;
  const vacantBeds = occupancy.totalBeds - occupancy.occupiedBeds;

  return [
    {
      label: "OPD Flow",
      value: String(today.opd),
      delta: `${opdDiff >= 0 ? "+" : ""}${opdDiff} vs yesterday`,
      tone: "success",
      dataKey: "opd"
    },
    {
      label: "Bed Occupancy",
      value: `${occupancy.hospitalOccupancyPercent}%`,
      delta: `${vacantBeds} bed${vacantBeds === 1 ? "" : "s"} free`,
      tone: "primary",
      dataKey: "beds"
    },
    {
      label: "Revenue Today",
      value: `Rs ${today.revenue.toLocaleString("en-IN")}`,
      delta: `${revenueDiffPercent >= 0 ? "+" : ""}${revenueDiffPercent}% vs yesterday`,
      tone: "success",
      dataKey: "revenue"
    },
    {
      label: "Critical Alerts",
      value: String(criticalAlerts),
      delta: `${snapshot.risks.lowStockItems} stock, ${snapshot.risks.urgentAppointments} urgent`,
      tone: criticalAlerts > 0 ? "danger" : "success",
      dataKey: "alerts"
    }
  ];
}

/** Real 7-day OPD/revenue trend for the Hospital OS command center charts. */
export async function createHospitalOsTrend(precomputed?: AnalyticsSnapshot) {
  const snapshot = precomputed ?? (await createAnalyticsSnapshot());
  return snapshot.trend.slice(-7).map((day) => ({
    time: new Date(day.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    opd: day.opd,
    revenue: Math.round((day.revenue / 100000) * 100) / 100
  }));
}

/** Live sidebar badge counts (Track 1.9): real queue depths instead of hardcoded figures. */
export function createHospitalOsNavBadges(snapshot: AnalyticsSnapshot): NavBadgeCounts {
  const badges: NavBadgeCounts = {};
  if (snapshot.queues.opdInFlight > 0) badges.OPD = snapshot.queues.opdInFlight;
  if (snapshot.queues.labPending > 0) badges.Laboratory = snapshot.queues.labPending;
  if (snapshot.queues.pharmacyUnpaid > 0) badges.Pharmacy = snapshot.queues.pharmacyUnpaid;
  return badges;
}
