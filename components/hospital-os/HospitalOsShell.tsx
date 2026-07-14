"use client";

import Fuse from "fuse.js";
import {
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  LogOut,
  ShieldCheck,
  X
} from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/hospital-os/CommandPalette";
import { ShortcutsDialog } from "@/components/hospital-os/ShortcutsDialog";
import { TopNav } from "@/components/hospital-os/TopNav";
import {
  accessRoleToHospitalRole,
  canAccessCommandEntity,
  commandRecords,
  fetchHospitalSnapshot,
  navGroupOrder,
  navItems
} from "@/lib/hospital-os-data";
import type { HospitalRealtimeEvent, NavBadgeCounts } from "@/lib/hospital-os-data";
import { moduleRouteFromHash } from "@/lib/access/admin-modules";
import { roleMeta, type AccessRole } from "@/lib/access/matrix";
import { createHospitalRealtimeClient } from "@/lib/websocket/hospital-os-client";
import { useHospitalOsStore } from "@/stores/hospital-os-store";

const commandFuse = new Fuse(commandRecords, {
  includeScore: true,
  threshold: 0.35,
  keys: [
    { name: "title", weight: 0.45 },
    { name: "subtitle", weight: 0.25 },
    { name: "entity", weight: 0.2 },
    { name: "keywords", weight: 0.1 }
  ]
});

// Track 4.13: lets the palette jump straight to a module page (Settings, HR, Access, ...) —
// commandRecords only covers searchable clinical entities, not the sidebar's own destinations.
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
    heldRoles: data.user?.roles ?? []
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
  const navRef = useRef<HTMLElement | null>(null);

  const {
    role,
    sidebarCollapsed,
    darkMode,
    setSidebarCollapsed,
    toggleSidebar,
    toggleDarkMode,
    setRole,
    realtimeStatus,
    setRealtimeStatus,
    addRealtimeMessage
  } = useHospitalOsStore();

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
    const storedTheme = window.localStorage.getItem("hospital-os-theme");
    if (storedSidebar) setSidebarCollapsed(storedSidebar === "collapsed");
    if (storedTheme === "dark" && !darkMode) toggleDarkMode();
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

  useEffect(() => {
    window.localStorage.setItem("hospital-os-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

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

  const commandResults = (commandQuery.trim() ? commandFuse.search(commandQuery).map((result) => result.item) : commandRecords).filter((item) =>
    canAccessCommandEntity(role, item.entity)
  );

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
    <main className={`${shellClass} min-h-screen bg-[var(--hos-bg)] text-[var(--hos-text)]`}>
      <div className="flex min-h-screen">
        <aside
          className={`${mobileNav ? "fixed inset-y-0 left-0 z-50" : "hidden"} ${sidebarCollapsed ? "w-[88px]" : "w-[286px]"} border-r border-[var(--hos-border)] bg-[var(--hos-surface)] lg:sticky lg:top-0 lg:z-20 lg:block lg:h-screen`}
        >
          <div className="flex h-16 items-center justify-between border-b border-[var(--hos-border)] px-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--hos-primary)] text-white">
                <HeartPulse size={19} />
              </div>
              {!sidebarCollapsed ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">MudgalGastromedics OS</p>
                  <p className="truncate text-xs text-[var(--hos-muted-text)]">Connected Healthcare. Unified Operations.</p>
                </div>
              ) : null}
            </div>
            <Button type="button" variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close navigation">
              <X size={16} />
            </Button>
          </div>

          <div className="flex h-[calc(100vh-64px)] flex-col gap-3 overflow-y-auto p-3">
            {!sidebarCollapsed ? (
              <div className="px-2 py-2">
                <p className="text-xs font-semibold uppercase text-[var(--hos-muted-text)]">Signed in</p>
                <div className="mt-2 grid gap-2 rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--hos-text)]">{osSession ? osSession.name : "Loading session..."}</p>
                    <p className="mt-0.5 truncate text-xs text-[var(--hos-muted-text)]">
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
                      className="min-h-9 w-full rounded-lg border border-[var(--hos-border)] bg-[var(--hos-surface)] px-2 text-xs font-semibold text-[var(--hos-text)]"
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
                        className="min-h-9 w-full rounded-lg border border-[var(--hos-border)] bg-[var(--hos-surface)] px-2 text-xs text-[var(--hos-text)]"
                        aria-label="Password confirmation for Super Admin elevation"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={roleSwitchBusy || !elevationPassword}
                        onClick={() => void switchWorkspaceRole("super-admin", elevationPassword)}
                        className="min-h-9 bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]"
                      >
                        <ShieldCheck size={14} /> Elevate for 30 min
                      </Button>
                    </div>
                  ) : null}
                  {roleSwitchError ? <p className="text-xs font-semibold text-[var(--hos-danger)]">{roleSwitchError}</p> : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void signOutOfWorkspace()}
                    className="min-h-9 border-[var(--hos-border)] bg-[var(--hos-surface)]"
                  >
                    <LogOut size={14} /> Sign out
                  </Button>
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
                      <p className="px-3 pb-0.5 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--hos-muted-text)]/70">{group}</p>
                    ) : null}
                    {items.map(({ label, icon: Icon, badge, href }) => {
                      const isCurrentPage = !href.startsWith("#") && pathname === href;
                      return (
                        <a
                          href={href}
                          key={label}
                          data-nav-item
                          onClick={() => setMobileNav(false)}
                          className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition hover:bg-[var(--hos-muted)] ${isCurrentPage ? "bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]" : "text-[var(--hos-muted-text)]"}`}
                          title={sidebarCollapsed ? label : undefined}
                          aria-current={isCurrentPage ? "page" : undefined}
                        >
                          <Icon size={18} className="shrink-0" />
                          {!sidebarCollapsed ? <span className="min-w-0 flex-1 truncate">{label}</span> : null}
                          {!sidebarCollapsed && badge ? <Badge className="bg-white/15 text-white hover:bg-white/15">{badge}</Badge> : null}
                        </a>
                      );
                    })}
                  </div>
                );
              })}
            </nav>

            <Button type="button" variant="outline" onClick={toggleSidebar} className="mt-auto hidden min-h-10 gap-2 border-[var(--hos-border)] bg-[var(--hos-bg)] lg:inline-flex">
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              {!sidebarCollapsed ? "Collapse" : null}
            </Button>
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
          />
          {children}
        </section>
      </div>

      <CommandPalette
        open={paletteOpen}
        setOpen={setPaletteOpen}
        query={commandQuery}
        setQuery={setCommandQuery}
        results={commandResults}
        pages={pageResults}
      />
      <ShortcutsDialog open={shortcutsOpen} setOpen={setShortcutsOpen} />
    </main>
  );
}
