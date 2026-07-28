"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Building2, Stethoscope } from "lucide-react";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ActionButton } from "@/components/design-system/ActionButton";
import { EmptyState } from "@/components/design-system/EmptyState";
import { DashboardOverview } from "@/components/hospital-os/DashboardOverview";
import { HospitalOsPageShell } from "@/components/hospital-os/HospitalOsPageShell";
import { PatientWorkspace } from "@/components/hospital-os/PatientWorkspace";
import { canAccessSection, fetchHospitalSnapshot, roleFallbackMessage } from "@/lib/hospital-os-data";
import { useHospitalOsStore } from "@/stores/hospital-os-store";

/**
 * `roleTodayBand` is a server-rendered RoleTodayBand element passed down from
 * app/mudgalgastromedics-os/page.tsx — RoleTodayBand is an async server
 * component and this whole tree is client-only (next/dynamic, ssr:false), so
 * it can't be imported here directly; it can only arrive pre-rendered as a
 * prop, same as any other "server component passed to a client component".
 *
 * HospitalOsPageShell provides the QueryClient + HospitalOsShell, same as
 * every per-module route — this used to hand-roll its own QueryClient here
 * (Track 2.7 audit: two ad hoc instances with identical config).
 */
export function HospitalOperatingSystem({ roleTodayBand }: { roleTodayBand?: ReactNode }) {
  return (
    <HospitalOsPageShell>
      <DashboardContent roleTodayBand={roleTodayBand} />
    </HospitalOsPageShell>
  );
}

/**
 * Dashboard-only content: the sidebar, TopNav, command palette and keyboard
 * shortcuts live in HospitalOsShell, shared with every per-module route.
 * This component owns only what's specific to the /mudgalgastromedics-os
 * dashboard itself — the live KPIs/trend/activity feed, the role's "Today"
 * band, and a per-patient clinical snapshot. Today's live patient-flow queue
 * (the sidebar's "Patients" entry) and the full staff notification inbox
 * (the sidebar's "Notifications" entry) each moved to their own dedicated
 * routes (Dashboard/Notifications/Patients routing fix) — see
 * components/hospital-os/PatientFlowPage.tsx and NotificationsPage.tsx.
 *
 * The build-acceptance checklist, the three "Vercel-style"/"Stripe-style"
 * preview forms, the session-only fake audit trail, the patient-portal
 * design preview, and the bulk-schedule/assign-doctor row actions that used
 * to live here were removed — none of them persisted to the real stores
 * (they only ever wrote a decorative audit-log line), and every one of them
 * duplicates a real, fully-working module already reachable from the
 * sidebar (Patients, Appointments, Billing, Doctor Portal, Patient Portal).
 */
function DashboardContent({ roleTodayBand }: { roleTodayBand?: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const { role, realtimeMessages } = useHospitalOsStore();

  const {
    data: snapshot = { rows: [], metrics: [], trend: [], navBadges: {} },
    isLoading
  } = useQuery({
    queryKey: ["hospital-os", "patient-flow"],
    queryFn: fetchHospitalSnapshot
  });

  const { rows, metrics: liveDashboardMetrics, trend: liveTrend } = snapshot;

  const access = useMemo(() => {
    const clinicalWorkspace = canAccessSection(role, "clinicalWorkspace");
    // Patient flow itself now lives on its own route (PatientFlowPage), but
    // a role that only has patientFlow access (not clinicalWorkspace) — e.g.
    // Reception, PRO — still has a real Hospital OS workspace to go to, so
    // hasAnySection must keep counting it here or they'd wrongly see the
    // "no workspace sections for this role" fallback below.
    const patientFlow = canAccessSection(role, "patientFlow");
    return {
      clinicalWorkspace,
      hasAnySection: clinicalWorkspace || patientFlow
    };
  }, [role]);

  return (
    <div className="mx-auto grid w-full max-w-[1560px] grid-cols-[minmax(0,1fr)] gap-5 px-4 py-5 lg:px-6">
      <motion.section
        className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_420px]"
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <DashboardOverview realtimeMessages={realtimeMessages} metrics={liveDashboardMetrics} series={liveTrend} isLoading={isLoading} />
      </motion.section>

      {/* Rendered after DashboardOverview's own h1 (Track 4.13) so RoleTodayBand's
          h2 doesn't precede the page's h1 in DOM order — axe's heading-order
          rule flags exactly that as an invalid jump once a later h3 (e.g. an
          empty-state) appears with no h2 between it and the page's h1. */}
      {roleTodayBand}

      {role === "Doctor" ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
              <Stethoscope size={22} />
            </span>
            <div>
              <p className="font-bold text-ink">Continue to your clinical workspace</p>
              <p className="text-sm text-muted">OPD queue, patient context, prescriptions and follow-up planning.</p>
            </div>
          </div>
          <ActionButton variant="primary" onClick={() => window.location.assign("/mudgalgastromedics-os/doctor-portal")}>
            Open Doctor Portal
          </ActionButton>
        </div>
      ) : null}

      {access.clinicalWorkspace ? <PatientWorkspace rows={rows} /> : null}

      {!access.hasAnySection ? (
        <EmptyState
          icon={Building2}
          title={roleFallbackMessage[role]?.title ?? "No workspace sections for this role yet"}
          description={roleFallbackMessage[role]?.description ?? `Hospital OS does not have dedicated ${role} sections built yet. Use the full Admin dashboard for now.`}
          action="Open Admin dashboard"
          onAction={() => window.location.assign("/admin")}
        />
      ) : null}
    </div>
  );
}
