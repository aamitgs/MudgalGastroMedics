"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";

/**
 * Dynamic-import loaders keyed by registry id (lib/access/admin-modules.ts).
 * Lives inside this client component (not passed in as a prop) because plain
 * functions can't cross the Server → Client Component boundary — the parent
 * page.tsx only ever passes the serializable `id` string.
 */
const moduleLoaders: Record<string, () => Promise<{ default: ComponentType }>> = {
  "module-reports": () => import("@/components/AdminReports").then((m) => ({ default: m.AdminReports })),
  "module-access": () => import("@/components/AdminUserManagement").then((m) => ({ default: m.AdminUserManagement })),
  "module-readiness": () => import("@/components/AdminProductionReadiness").then((m) => ({ default: m.AdminProductionReadiness })),
  "module-audit": () => import("@/components/AdminAuditLog").then((m) => ({ default: m.AdminAuditLog })),
  "module-analytics": () => import("@/components/AdminAnalytics").then((m) => ({ default: m.AdminAnalytics })),
  "module-cms": () => import("@/components/AdminCmsWorkspace").then((m) => ({ default: m.AdminCmsWorkspace })),
  "module-modules": () => import("@/components/AdminEnterpriseModules").then((m) => ({ default: m.AdminEnterpriseModules })),
  "module-automation": () => import("@/components/AdminAutomation").then((m) => ({ default: m.AdminAutomation })),
  "module-ai-reviews": () => import("@/components/AdminAiReviews").then((m) => ({ default: m.AdminAiReviews })),
  "module-patients": () => import("@/components/AdminPatients").then((m) => ({ default: m.AdminPatients })),
  "module-appointments": () => import("@/components/AdminAppointments").then((m) => ({ default: m.AdminAppointments })),
  "module-opd": () => import("@/components/AdminOpdQueue").then((m) => ({ default: m.AdminOpdQueue })),
  "module-procedures": () => import("@/components/AdminProcedures").then((m) => ({ default: m.AdminProcedures })),
  "module-ipd": () => import("@/components/AdminIpdBeds").then((m) => ({ default: m.AdminIpdBeds })),
  "module-doctor-workflow": () => import("@/components/AdminDoctorWorkflow").then((m) => ({ default: m.AdminDoctorWorkflow })),
  "module-lab": () => import("@/components/AdminLab").then((m) => ({ default: m.AdminLab })),
  "module-pharmacy": () => import("@/components/AdminPharmacy").then((m) => ({ default: m.AdminPharmacy })),
  "module-billing": () => import("@/components/AdminBillingSummary").then((m) => ({ default: m.AdminBillingSummary })),
  "module-finance": () => import("@/components/AdminFinance").then((m) => ({ default: m.AdminFinance })),
  "module-hr": () => import("@/components/AdminHR").then((m) => ({ default: m.AdminHR })),
  "module-inventory": () => import("@/components/AdminInventory").then((m) => ({ default: m.AdminInventory })),
  "module-communication": () => import("@/components/AdminCommunication").then((m) => ({ default: m.AdminCommunication })),
  "module-settings": () => import("@/components/AdminSettings").then((m) => ({ default: m.AdminSettings }))
};

/** Fired by AdminModuleNav on a jump-nav click; see the mount-on-jump note below. */
export const ADMIN_MODULE_JUMP_EVENT = "admin-module-jump";

/**
 * Lazy-mounts a heavy `/admin` module only once its section scrolls near the
 * viewport (Track 4.1). Below-fold modules cost nothing on first paint — no
 * JS chunk fetch, no component mount, no data fetch — until the staff member
 * actually scrolls (or jump-navs) to them. `rootMargin` starts the fetch
 * before the section is actually visible so it's ready by the time it is.
 *
 * Jump-nav clicks mount their target immediately via a custom event, instead
 * of waiting on the intersection observer: a big jump can cross many other
 * modules' `rootMargin` zones at once, triggering a cascade of concurrent
 * loads whose content keeps resolving from skeleton to real (taller) height
 * for a few seconds and shifting the page — the *target* module shouldn't
 * have to wait out that settling just to start loading its own data. The
 * same applies to a URL that already carries the hash on first load (a
 * bookmark, an external link like the Patient Drawer's quick actions, or a
 * browser refresh) — there's no click to catch, so mount is also checked
 * against `location.hash` directly on mount.
 *
 * Once mounted, a module stays mounted (never unmounts on scroll-away) so its
 * local state and in-flight data aren't lost as the page is used normally.
 */
export function LazyModuleSection({ id }: { id: string }) {
  const ref = useRef<HTMLElement>(null);
  const requested = useRef(false);
  const [Component, setComponent] = useState<ComponentType | null>(null);

  useEffect(() => {
    const loader = moduleLoaders[id];
    if (!loader) return;

    let active = true;
    let observer: IntersectionObserver | null = null;

    function mount() {
      if (requested.current) return;
      requested.current = true;
      observer?.disconnect();
      void loader().then((mod) => {
        if (active) setComponent(() => mod.default);
      });
    }

    if (window.location.hash === `#${id}`) mount();

    function onJump(event: Event) {
      if ((event as CustomEvent<{ id: string }>).detail?.id === id) mount();
    }
    window.addEventListener(ADMIN_MODULE_JUMP_EVENT, onJump);

    const node = ref.current;
    if (node) {
      observer = new IntersectionObserver((entries) => (entries[0]?.isIntersecting ? mount() : undefined), { rootMargin: "200px 0px" });
      observer.observe(node);
    }

    return () => {
      active = false;
      window.removeEventListener(ADMIN_MODULE_JUMP_EVENT, onJump);
      observer?.disconnect();
    };
  }, [id]);

  return (
    <section id={id} className="scroll-mt-28" ref={ref}>
      {Component ? <Component /> : <ModuleSkeleton />}
    </section>
  );
}
