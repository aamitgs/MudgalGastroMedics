"use client";

import Fuse from "fuse.js";
import { useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
  X
} from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ActionButton } from "@/components/design-system/ActionButton";
import { StaffFooter } from "@/components/chrome/StaffFooter";
import { CommandPalette } from "@/components/hospital-os/CommandPalette";
import { PatientDrawer } from "@/components/hospital-os/PatientDrawer";
import { ShortcutsDialog } from "@/components/hospital-os/ShortcutsDialog";
import { TopNav } from "@/components/hospital-os/TopNav";
import {
  accessRoleToHospitalRole,
  fetchHospitalSnapshot,
  navGroupOrder,
  navItems
} from "@/lib/hospital-os-data";
import type { CommandRecord, HospitalRealtimeEvent, NavBadgeCounts } from "@/lib/hospital-os-data";
import type { SearchCategory, SearchResult } from "@/lib/global-search";
import { moduleRouteFromHash } from "@/lib/access/admin-modules";
import { roleMeta, type AccessRole } from "@/lib/access/matrix";
import { createHospitalRealtimeClient } from "@/lib/websocket/hospital-os-client";
import { useHospitalOsStore } from "@/stores/hospital-os-store";
import { useThemeStore } from "@/stores/theme-store";

// Dashboard-only anchor sections (Dashboard, Patients, Notifications sidebar
// entries), top-to-bottom in real DOM order — #realtime-feed renders nested
// inside #analytics's own section (DashboardOverview's second card), not as
// a separate sibling, so a naive "any part visible" check would flag both
// at once. Scroll-spy below picks whichever section's top has most recently
// scrolled past the threshold, which resolves that correctly regardless of
// the nesting.
const dashboardSectionIds = ["analytics", "realtime-feed", "operations-table"];

const searchCategoryEntity: Record<SearchCategory, CommandRecord["entity"]> = {
  Patients: "Patient",
  Appointments: "Appointment",
  Laboratory: "Report",
  Pharmacy: "Medicine",
  Admissions: "Bed",
  Employees: "Employee"
};

function toCommandRecord(result: SearchResult): CommandRecord {
  return {
    id: result.id,
    entity: searchCategoryEntity[result.category],
    title: result.title,
    subtitle: result.subtitle,
    href: result.href,
    patientPhone: result.patientPhone
  };
}

// Lets the palette jump straight to a module page (Settings, HR, Access, ...) —
// live search (/api/search) covers searchable clinical entities separately.
const navFuse = new Fuse(navItems, {
  includeScore: true,
  threshold: 0.35,
  keys: [
    { name: "label", weight: 0.7 },
    { name: "keywords", weight: 0.3 }
  ]
});

function realtimeEventMessage(event: HospitalRealtimeEvent) {
  switch (event.type) {
    case "notification.created":
      return event.payload.message;
    case "queue.updated":
      return `Queue: ${event.payload.uhid} moved to ${event.payload.status}`;
    case "bed.updated":
      return `Bed ${event.payload.bedId}: ${event.payload.status}`;
    case "doctor.updated":
      return `Doctor ${event.payload.doctorId} is now ${event.payload.available ? "available" : "unavailable"}`;
    case "pharmacy.stock.updated":
      return `Pharmacy stock: ${event.payload.item} at ${event.payload.stock} (threshold ${event.payload.threshold})`;
    case "dashboard.metric.updated":
      return `${event.payload.metric} updated to ${event.payload.value}`;
    default:
      return "Hospital OS event";
  }
}

type OsSession = {
  name: string;
  legacy: boolean;
  activeRole: AccessRole;
  heldRoles: AccessRole[];
  hasPhoto: boolean;
};

async function fetchOsSession(): Promise<OsSession | null> {
  const response = await fetch("/api/auth/me", { cache: "no-store" });
  if (!response.ok) return null;
  const data = await response.json().catch(() => null);
  if (!data?.ok) return null;
  return {
    name: data.user?.name ?? "Staff",
    legacy: Boolean(data.legacy),
    activeRole: data.activeRole,
    heldRoles: data.user?.roles ?? [],
    hasPhoto: Boolean(data.user?.hasPhoto)
  };
}

/**
 * Persistent Hospital OS chrome (sidebar + TopNav + command palette +
 * keyboard shortcuts), extracted from the monolith (Track 4.13,
 * docs/build-roadmap.md) so every per-module route — not just the dashboard —
 * gets real in-app navigation instead of being reachable only by direct URL.
 *
 * Deliberately still "use client" and still reads role/theme/sidebar state
 * from the same Zustand store the dashboard already used — this extraction
 * moves JSX and effects, it does not change where state lives or how it's
 * derived, to keep behavior identical to the pre-extraction monolith.
 */
export function HospitalOsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [liveSearchResults, setLiveSearchResults] = useState<CommandRecord[]>([]);
  const [activeDashboardSection, setActiveDashboardSection] = useState(dashboardSectionIds[0]);
  const navRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();

  // Live entity search (/api/search) — the server already gates each category
  // by the same RBAC matrix enforced everywhere else, so no client-side
  // permission re-check is needed for these results.
  useEffect(() => {
    if (!paletteOpen) return;
    const trimmed = commandQuery.trim();
    let active = true;
    const timer = window.setTimeout(async () => {
      if (trimmed.length < 2) {
        setLiveSearchResults([]);
        return;
      }
      const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { cache: "no-store" }).catch(() => null);
      if (!active) return;
      const data = ((await response?.json().catch(() => ({}))) ?? {}) as { ok: boolean; results?: SearchResult[] };
      if (!active) return;
      setLiveSearchResults(response?.ok && data.ok && data.results ? data.results.map(toCommandRecord) : []);
    }, 200);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [commandQuery, paletteOpen]);

  const {
    role,
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
    setRole,
    realtimeStatus,
    setRealtimeStatus,
    addRealtimeMessage
  } = useHospitalOsStore();
  const { dark: darkMode, toggleDark: toggleDarkMode } = useThemeStore();

  // Same queryKey + queryFn the dashboard content uses for its own full
  // snapshot — react-query dedupes to one request when both are mounted
  // (the dashboard page), and this still resolves correctly on its own on
  // every other Hospital OS page where the dashboard content isn't mounted.
  const { data: navBadges = {} as NavBadgeCounts } = useQuery({
    queryKey: ["hospital-os", "patient-flow"],
    queryFn: fetchHospitalSnapshot,
    select: (data) => data.navBadges
  });

  const queryClient = useQueryClient();
  const { data: osSession } = useQuery({
    queryKey: ["hospital-os", "session"],
    queryFn: fetchOsSession
  });
  const [pendingElevationRole, setPendingElevationRole] = useState<AccessRole | "">("");
  const [elevationPassword, setElevationPassword] = useState("");
  const [roleSwitchError, setRoleSwitchError] = useState("");
  const [roleSwitchBusy, setRoleSwitchBusy] = useState(false);

  // The OS workspace follows the authenticated session's active role; there is
  // no free role picker — switching roles goes through the real, audited
  // /api/auth/role endpoint below.
  useEffect(() => {
    if (osSession) setRole(accessRoleToHospitalRole[osSession.activeRole] ?? "Front Desk");
  }, [osSession, setRole]);

  async function switchWorkspaceRole(target: AccessRole, password?: string) {
    setRoleSwitchBusy(true);
    setRoleSwitchError("");
    try {
      const response = await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: target, password })
      });
      const data = await response.json().catch(() => ({}));
      if (!data.ok) {
        setRoleSwitchError(data.error || "Could not switch role.");
        return;
      }
      setPendingElevationRole("");
      setElevationPassword("");
      await queryClient.invalidateQueries({ queryKey: ["hospital-os", "session"] });
    } finally {
      setRoleSwitchBusy(false);
    }
  }

  async function signOutOfWorkspace() {
    if (osSession?.legacy) await fetch("/api/admin/session", { method: "DELETE" });
    else await fetch("/api/auth/logout", { method: "POST" });
    // /login is a redirect to here (retired, same reasoning as /admin) —
    // going straight there skips the hop; this page shows the same
    // WorkspaceLauncher once signed out.
    window.location.assign("/mudgalgastromedics-os");
  }

  useEffect(() => {
    const storedSidebar = window.localStorage.getItem("hospital-os-sidebar");
    if (storedSidebar) setSidebarCollapsed(storedSidebar === "collapsed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Retired /admin's anchor-scroll modules (Track 4.13) each got a real route,
  // but a server-side redirect can never see a URL's #hash (browsers don't
  // send it) — it only preserves whatever hash the visitor already had. So an
  // old /admin#module-hr bookmark lands here as /mudgalgastromedics-os#module-hr;
  // this one-time check finishes that journey client-side, onto the real page.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const target = moduleRouteFromHash(hash);
    if (target && target !== pathname) window.location.replace(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.localStorage.setItem("hospital-os-sidebar", sidebarCollapsed ? "collapsed" : "expanded");
  }, [sidebarCollapsed]);

  // Scroll-spy for the dashboard's own Dashboard/Patients/Notifications
  // sidebar entries (Track 4.15): they all point at the single dashboard
  // page via #hash, so pathname alone can't tell them apart. A no-op on
  // every other route, since none of these ids exist there.
  useEffect(() => {
    if (pathname !== "/mudgalgastromedics-os") return;
    let frame = 0;
    function updateActiveSection() {
      // Viewport-relative, not a fixed pixel value — #operations-table sits
      // near the bottom of a short page and can never scroll closer to the
      // top than its own remaining scroll room allows, so a small fixed
      // threshold would never trigger for it.
      const threshold = window.innerHeight * 0.5;
      const tops = Object.fromEntries(
        dashboardSectionIds.map((id) => [id, document.getElementById(id)?.getBoundingClientRect().top ?? Infinity])
      );
      let current = dashboardSectionIds[0];
      for (const id of dashboardSectionIds) {
        if (tops[id] > threshold) continue;
        // #realtime-feed renders as DashboardOverview's second card inside
        // #analytics's own section, side-by-side with it in a 2-column grid
        // at xl+ widths (grid-cols-[1fr_420px]) — their tops are identical
        // there at every scroll position, not just on load, so "Dashboard"
        // keeps priority until they genuinely diverge (a narrower, stacked
        // layout where #realtime-feed's card has scrolled independently).
        if (id === "realtime-feed" && Math.abs(tops[id] - tops.analytics) < 2) continue;
        current = id;
      }
      setActiveDashboardSection(current);
    }
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateActiveSection);
    }
    updateActiveSection();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  // Dashboard/Notifications/Patients clicks while already on the dashboard page:
  // native <a href="#hash"> scrolling silently no-ops when the target's scroll
  // position doesn't change (e.g. #realtime-feed sits beside #analytics in the
  // xl+ grid, so clicking "Notifications" moves nothing). A brief ring flash on
  // the destination section gives the click visible confirmation regardless of
  // whether the page actually scrolled.
  function focusDashboardSection(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    el.classList.add("ring-4", "ring-brand/30", "transition-shadow", "duration-300");
    window.setTimeout(() => el.classList.remove("ring-4", "ring-brand/30"), 900);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (event.key === "?") {
        event.preventDefault();
        setShortcutsOpen(true);
      }
      if (event.key === "Escape") setPaletteOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Single realtime connection per Hospital OS page load, owned here so every
  // route (not just the dashboard) shows a live status in TopNav; messages
  // land in the shared store so the dashboard's own feed panel can read them
  // without opening a second connection.
  useEffect(() => {
    const client = createHospitalRealtimeClient({
      url: process.env.NEXT_PUBLIC_HOSPITAL_WS_URL,
      pollingUrl: "/api/hospital-os/realtime",
      pollingMs: 6000,
      onStatus: setRealtimeStatus,
      onEvent: (event) => {
        const text = realtimeEventMessage(event);
        const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${event.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        addRealtimeMessage({ id, text });
      }
    });

    client.connect();
    return () => client.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleNav = navItems
    .filter((item) => item.roles.includes(role))
    .map((item) => {
      const liveCount = navBadges[item.label as keyof NavBadgeCounts];
      return liveCount === undefined ? item : { ...item, badge: String(liveCount) };
    });

  // Empty query shows no entity results (there's nothing meaningful to list
  // without a search term) — matches GlobalCommandPalette's own behavior.
  const commandResults = commandQuery.trim() ? liveSearchResults : [];

  const pageResults = (commandQuery.trim() ? navFuse.search(commandQuery).map((result) => result.item) : navItems).filter((item) =>
    item.roles.includes(role)
  );

  function onSidebarKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const buttons = Array.from(navRef.current?.querySelectorAll<HTMLElement>("[data-nav-item]") ?? []);
    const currentIndex = buttons.indexOf(document.activeElement as HTMLElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      buttons[(currentIndex + 1) % buttons.length]?.focus();
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      buttons[(currentIndex - 1 + buttons.length) % buttons.length]?.focus();
    }
    if (event.key === "Enter") {
      (document.activeElement as HTMLElement | null)?.click();
    }
  }

  const shellClass = darkMode ? "hospital-os-theme dark" : "hospital-os-theme";

  return (
    <main className={`${shellClass} min-h-screen bg-mist text-ink`}>
      <div className="flex min-h-screen">
        <aside
          className={`${mobileNav ? "fixed inset-y-0 left-0 z-50" : "hidden"} ${sidebarCollapsed ? "w-[88px]" : "w-[286px]"} border-r border-line bg-surface lg:sticky lg:top-0 lg:z-20 lg:block lg:h-screen`}
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white">
                <Image src="/mgm-icon.png" alt="" width={948} height={1500} className="h-7 w-auto object-contain" />
              </div>
              {!sidebarCollapsed ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">MudgalGastromedics OS</p>
                  <p className="truncate text-xs text-muted">Connected Healthcare. Unified Operations.</p>
                </div>
              ) : null}
            </div>
            <ActionButton variant="ghost" size="sm" className="h-8 w-8 px-0 lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close navigation">
              <X size={16} />
            </ActionButton>
          </div>

          <div className="flex h-[calc(100vh-64px)] flex-col gap-3 overflow-y-auto p-3">
            {!sidebarCollapsed ? (
              <div className="px-2 py-2">
                <p className="text-xs font-semibold uppercase text-muted">Signed in</p>
                <div className="mt-2 grid gap-2 rounded-lg border border-line bg-mist p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{osSession ? osSession.name : "Loading session..."}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {osSession ? roleMeta[osSession.activeRole].label : ""}
                      {osSession?.legacy ? " (legacy login)" : ""}
                    </p>
                  </div>
                  {osSession && !osSession.legacy && osSession.heldRoles.length > 1 ? (
                    <select
                      value={pendingElevationRole || osSession.activeRole}
                      onChange={(event) => {
                        const target = event.target.value as AccessRole;
                        if (target === osSession.activeRole) {
                          setPendingElevationRole("");
                          return;
                        }
                        if (target === "super-admin") {
                          setPendingElevationRole(target);
                          return;
                        }
                        void switchWorkspaceRole(target);
                      }}
                      disabled={roleSwitchBusy}
                      className="min-h-9 w-full rounded-lg border border-line bg-surface px-2 text-xs font-semibold text-ink"
                      aria-label="Switch to another of your roles"
                    >
                      {osSession.heldRoles.map((held) => (
                        <option key={held} value={held}>{roleMeta[held].label}</option>
                      ))}
                    </select>
                  ) : null}
                  {pendingElevationRole === "super-admin" ? (
                    <div className="grid gap-2">
                      <input
                        type="password"
                        value={elevationPassword}
                        onChange={(event) => setElevationPassword(event.target.value)}
                        placeholder="Confirm password to elevate"
                        className="min-h-9 w-full rounded-lg border border-line bg-surface px-2 text-xs text-ink"
                        aria-label="Password confirmation for Super Admin elevation"
                      />
                      <ActionButton
                        variant="primary"
                        size="sm"
                        disabled={roleSwitchBusy || !elevationPassword}
                        onClick={() => void switchWorkspaceRole("super-admin", elevationPassword)}
                        className="min-h-9"
                      >
                        <ShieldCheck size={14} /> Elevate for 30 min
                      </ActionButton>
                    </div>
                  ) : null}
                  {roleSwitchError ? <p className="text-xs font-semibold text-coral">{roleSwitchError}</p> : null}
                  <ActionButton
                    variant="outline"
                    size="sm"
                    onClick={() => void signOutOfWorkspace()}
                    className="min-h-9"
                  >
                    <LogOut size={14} /> Sign out
                  </ActionButton>
                </div>
              </div>
            ) : null}

            <nav ref={navRef} onKeyDown={onSidebarKeyDown} className="grid gap-2" aria-label="Hospital OS sections">
              {navGroupOrder.map((group) => {
                const items = visibleNav.filter((item) => item.group === group);
                if (!items.length) return null;
                return (
                  <div key={group} className="grid gap-1" role="group" aria-label={group}>
                    {!sidebarCollapsed ? (
                      <p className="px-3 pb-0.5 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted/70">{group}</p>
                    ) : null}
                    {items.map(({ label, icon: Icon, badge, href }) => {
                      const [hrefPath, hrefHash] = href.split("#");
                      const isCurrentPage = hrefHash
                        ? pathname === hrefPath && activeDashboardSection === hrefHash
                        : pathname === href;
                      return (
                        <a
                          href={href}
                          key={label}
                          data-nav-item
                          onClick={(event) => {
                            setMobileNav(false);
                            if (!hrefHash || pathname !== hrefPath) return;
                            // Already on the target page — a full navigation (and its
                            // native anchor-scroll) would be a no-op, so drive the
                            // scroll/highlight ourselves instead of letting the <a> fire.
                            event.preventDefault();
                            window.history.pushState(null, "", href);
                            setActiveDashboardSection(hrefHash);
                            focusDashboardSection(hrefHash);
                          }}
                          className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition hover:bg-soft ${isCurrentPage ? "bg-brand text-white hover:bg-brand" : "text-muted"}`}
                          title={sidebarCollapsed ? label : undefined}
                          aria-current={isCurrentPage ? "page" : undefined}
                        >
                          <Icon size={18} className="shrink-0" />
                          {!sidebarCollapsed ? <span className="min-w-0 flex-1 truncate">{label}</span> : null}
                          {!sidebarCollapsed && badge ? (
                            <span className="inline-flex h-5 items-center justify-center rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold text-white">{badge}</span>
                          ) : null}
                        </a>
                      );
                    })}
                  </div>
                );
              })}
            </nav>

            <ActionButton variant="outline" onClick={toggleSidebar} className="mt-auto hidden min-h-10 gap-2 lg:inline-flex">
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              {!sidebarCollapsed ? "Collapse" : null}
            </ActionButton>
          </div>
        </aside>

        {mobileNav ? <button type="button" aria-label="Close navigation overlay" className="fixed inset-0 z-40 bg-ink/30 lg:hidden" onClick={() => setMobileNav(false)} /> : null}

        <section className="min-w-0 flex-1">
          <TopNav
            onOpenSidebar={() => setMobileNav(true)}
            onOpenPalette={() => setPaletteOpen(true)}
            onOpenShortcuts={() => setShortcutsOpen(true)}
            darkMode={darkMode}
            onToggleTheme={toggleDarkMode}
            realtimeStatus={realtimeStatus}
            hasPhoto={Boolean(osSession?.hasPhoto)}
            onPhotoUpdated={() => queryClient.invalidateQueries({ queryKey: ["hospital-os", "session"] })}
          />
          {children}
        </section>
      </div>

      <StaffFooter onOpenShortcuts={() => setShortcutsOpen(true)} />

      <CommandPalette
        open={paletteOpen}
        setOpen={setPaletteOpen}
        query={commandQuery}
        setQuery={setCommandQuery}
        results={commandResults}
        pages={pageResults}
      />
      <ShortcutsDialog open={shortcutsOpen} setOpen={setShortcutsOpen} />
      <PatientDrawer />
      <Toaster richColors closeButton position="top-right" theme={darkMode ? "dark" : "light"} />
    </main>
  );
}
