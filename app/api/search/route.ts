import { NextResponse } from "next/server";
import { getRequestAccessContext } from "@/lib/access/guard";
import { roleHasPermission } from "@/lib/access/matrix";
import { listAppointments } from "@/lib/appointment-store";
import {
  rankSearchResults,
  searchAdmissions,
  searchAppointments,
  searchInventory,
  searchLabOrders,
  searchPatients,
  searchStaff,
  type SearchResult
} from "@/lib/global-search";
import { listStaff } from "@/lib/hr-store";
import { listInventoryItems } from "@/lib/inventory-store";
import { listIpdAdmissions } from "@/lib/ipd-store";
import { listLabOrders } from "@/lib/lab-store";
import { listPatients } from "@/lib/patient-store";

const minQueryLength = 2;

/**
 * Global search (Track 2.6): categorized results over live stores, gated by
 * the same permission matrix the server enforces everywhere — a role never
 * sees a category it cannot open.
 */
export async function GET(request: Request) {
  const context = await getRequestAccessContext(request);
  if (!context.authenticated || context.activeRole === "patient") {
    return NextResponse.json({ ok: false, error: "Staff login required." }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < minQueryLength) {
    return NextResponse.json({ ok: true, results: [] satisfies SearchResult[] });
  }

  const role = context.activeRole;
  const can = (resource: Parameters<typeof roleHasPermission>[1]) => role === "super-admin" || roleHasPermission(role, resource, "view");

  const groups: SearchResult[][] = [];
  if (can("patients")) groups.push(searchPatients(query, await listPatients()));
  if (can("appointments")) groups.push(searchAppointments(query, await listAppointments()));
  if (can("lab-orders")) groups.push(searchLabOrders(query, await listLabOrders()));
  if (can("pharmacy-inventory")) groups.push(searchInventory(query, await listInventoryItems()));
  if (can("beds")) groups.push(searchAdmissions(query, await listIpdAdmissions()));
  if (can("hr-records")) groups.push(searchStaff(query, await listStaff()));

  return NextResponse.json({ ok: true, results: rankSearchResults(groups) });
}
