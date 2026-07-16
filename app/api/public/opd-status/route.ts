import { NextResponse } from "next/server";
import { averageWaitMinutes } from "@/lib/analytics";
import { listOpdVisits } from "@/lib/opd-store";
import { getIndiaWeekdayMinutes, isOpdOpenNow } from "@/lib/site-data";

// Deliberately public (no authorize()/session gate) and deliberately narrow:
// only a coarse queue count + average wait in minutes, nothing patient-
// identifiable — a public booking-page widget, not an operations surface.
export async function GET() {
  const now = new Date();
  const { weekdayShort, minutesSinceMidnight } = getIndiaWeekdayMinutes(now);
  const isOpen = isOpdOpenNow(weekdayShort, minutesSinceMidnight);

  const visits = await listOpdVisits();
  const todayKey = now.toISOString().slice(0, 10);
  const todaysVisits = visits.filter((visit) => visit.createdAt.slice(0, 10) === todayKey);

  const queueLength = visits.filter((visit) => visit.status === "Waiting" || visit.status === "In Consultation").length;
  const avgWaitMinutes = averageWaitMinutes(todaysVisits);

  return NextResponse.json(
    { ok: true, isOpen, queueLength, avgWaitMinutes, updatedAt: now.toISOString() },
    { headers: { "Cache-Control": "public, max-age=60" } }
  );
}
